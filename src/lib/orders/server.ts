import "server-only";

import { getEmailAdapter } from "@/lib/adapters/email";
import { getPaymentAdapter, type PaymentStatus } from "@/lib/adapters/payments";
import { NL_POSTCODE_RE } from "@/lib/adapters/postcode";
import { shippingCostCents } from "@/lib/adapters/shipping";
import { buildCartView, getCartIdByToken } from "@/lib/cart/server";
import {
  calculateOrderTotals,
  type Discount,
  type OrderTotals,
} from "@/lib/cart/totals";
import { inclBtwCents, lt } from "@/lib/format";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/routing";
import type { Json } from "@/types/database.types";

type Admin = ReturnType<typeof createAdminClient>;

export interface Address {
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  addition?: string;
  postcode: string;
  city: string;
  country: string;
}

export interface CheckoutInput {
  email: string;
  customerType: "b2c" | "b2b";
  companyName?: string;
  vatNumber?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  shippingMethodCode: string;
  pickupPoint?: { id: string; name: string; street: string; city: string; postcode: string };
  promoCode?: string;
  locale: Locale;
}

export class CheckoutError extends Error {
  constructor(
    public code:
      | "empty_cart"
      | "invalid_input"
      | "out_of_stock"
      | "invalid_shipping_method"
      | "invalid_promo",
    detail?: string,
  ) {
    super(detail ?? code);
  }
}

const EU_VAT_RE = /^(AT|BE|BG|HR|CY|CZ|DK|EE|FI|FR|DE|EL|HU|IE|IT|LV|LT|LU|MT|NL|PL|PT|RO|SK|SI|ES|SE)[0-9A-Z]{8,12}$/;

function validateAddress(a: Address | undefined): a is Address {
  if (!a) return false;
  return Boolean(
    a.firstName?.trim() &&
      a.lastName?.trim() &&
      a.street?.trim() &&
      a.houseNumber?.trim() &&
      NL_POSTCODE_RE.test(a.postcode?.replace(/\s/g, "") ?? "") &&
      a.city?.trim(),
  );
}

/** B2B with a syntactically valid non-NL EU VAT id -> intra-EU reverse charge. */
export function qualifiesForReverseCharge(
  customerType: "b2c" | "b2b",
  vatNumber: string | undefined,
): boolean {
  if (customerType !== "b2b" || !vatNumber) return false;
  const clean = vatNumber.replace(/[\s.]/g, "").toUpperCase();
  return EU_VAT_RE.test(clean) && !clean.startsWith("NL");
}

async function resolvePromo(
  supabase: Admin,
  code: string,
  subtotalExclCents: number,
): Promise<Discount> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new CheckoutError("invalid_promo");

  const now = new Date().toISOString();
  if (
    (data.valid_from && data.valid_from > now) ||
    (data.valid_until && data.valid_until < now) ||
    (data.max_uses != null && data.use_count >= data.max_uses) ||
    subtotalExclCents < data.min_order_cents
  ) {
    throw new CheckoutError("invalid_promo");
  }
  return { type: data.discount_type as Discount["type"], value: data.value };
}

export interface PricedCheckout {
  totals: OrderTotals;
  shippingMethod: {
    code: string;
    name: Json;
    supports_pickup: boolean;
  };
  items: Awaited<ReturnType<typeof buildCartView>>["items"];
}

/**
 * Server-side pricing for both the checkout preview and order creation —
 * one code path, so what the customer sees is exactly what gets charged.
 */
export async function priceCheckout(
  supabase: Admin,
  cartToken: string,
  opts: { shippingMethodCode: string; promoCode?: string; reverseCharge: boolean },
): Promise<PricedCheckout> {
  const cartId = await getCartIdByToken(supabase, cartToken);
  if (!cartId) throw new CheckoutError("empty_cart");
  const cart = await buildCartView(supabase, cartId);
  if (cart.items.length === 0) throw new CheckoutError("empty_cart");

  const { data: method, error } = await supabase
    .from("shipping_methods")
    .select("code, name, price_cents, free_above_cents, supports_pickup")
    .eq("code", opts.shippingMethodCode)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!method) throw new CheckoutError("invalid_shipping_method");

  const pricedItems = cart.items.map((i) => ({
    unitPriceExclCents: i.unitPriceExclCents,
    quantity: i.quantity,
    vatRate: i.vatRate,
  }));

  const productTotalIncl = cart.totals.totalInclCents;
  const shippingExclCents = shippingCostCents(method, productTotalIncl);

  const discount = opts.promoCode
    ? await resolvePromo(supabase, opts.promoCode, cart.totals.subtotalExclCents)
    : null;

  const totals = calculateOrderTotals(pricedItems, {
    shippingExclCents,
    discount,
    reverseCharge: opts.reverseCharge,
  });

  return { totals, shippingMethod: method, items: cart.items };
}

export async function createOrder(
  cartToken: string,
  input: CheckoutInput,
): Promise<{ orderId: string; checkoutUrl: string; confirmationToken: string }> {
  if (
    !input.email?.includes("@") ||
    !validateAddress(input.shippingAddress) ||
    (input.billingAddress && !validateAddress(input.billingAddress)) ||
    (input.customerType === "b2b" && !input.companyName?.trim())
  ) {
    throw new CheckoutError("invalid_input");
  }

  const supabase = createAdminClient();
  const reverseCharge = qualifiesForReverseCharge(input.customerType, input.vatNumber);
  const priced = await priceCheckout(supabase, cartToken, {
    shippingMethodCode: input.shippingMethodCode,
    promoCode: input.promoCode,
    reverseCharge,
  });

  // stock revalidation at order time (cart clamps are advisory only)
  for (const item of priced.items) {
    if (item.quantity > item.stockQuantity) {
      throw new CheckoutError("out_of_stock", item.sku);
    }
  }

  const cartId = await getCartIdByToken(supabase, cartToken);
  const adapter = getPaymentAdapter();

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      cart_id: cartId,
      email: input.email.trim().toLowerCase(),
      payment_provider: adapter.provider,
      locale: input.locale,
      customer_type: input.customerType,
      company_name: input.companyName?.trim() || null,
      vat_number: input.vatNumber?.replace(/[\s.]/g, "").toUpperCase() || null,
      reverse_charge: reverseCharge,
      shipping_address: input.shippingAddress as unknown as Json,
      billing_address: (input.billingAddress ?? input.shippingAddress) as unknown as Json,
      shipping_method_code: priced.shippingMethod.code,
      shipping_cost_cents: priced.totals.shippingExclCents,
      pickup_point: (input.pickupPoint ?? null) as unknown as Json,
      promo_code: input.promoCode?.toUpperCase() || null,
      promo_discount_cents: priced.totals.discountExclCents,
      subtotal_excl_cents: priced.totals.subtotalExclCents,
      vat_breakdown: priced.totals.vatBreakdown as unknown as Json,
      total_incl_cents: priced.totals.totalInclCents,
    })
    .select("id, order_number, confirmation_token")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("order_items").insert(
    priced.items.map((i) => ({
      order_id: order.id,
      variant_id: i.variantId,
      product_name: i.productName as unknown as Json,
      product_slug: i.productSlug as unknown as Json,
      sku: i.sku,
      options: i.options as unknown as Json,
      image_path: i.imagePath,
      unit_price_excl_cents: i.unitPriceExclCents,
      vat_rate: i.vatRate,
      quantity: i.quantity,
    })),
  );
  if (itemsError) throw itemsError;

  const confirmationUrl =
    absoluteUrl(input.locale, {
      pathname: "/bestelling/[orderId]",
      params: { orderId: order.id },
    }) + `?token=${order.confirmation_token}`;
  const demoCheckoutUrl =
    absoluteUrl(input.locale, {
      pathname: "/betaling/[orderId]",
      params: { orderId: order.id },
    }) + `?token=${order.confirmation_token}`;

  const payment = await adapter.createPayment({
    orderId: order.id,
    orderNumber: order.order_number,
    amountCents: priced.totals.totalInclCents,
    description: `Vondel Cycles ${order.order_number} (demo)`,
    redirectUrl: confirmationUrl,
    webhookUrl: `${siteUrl()}/api/webhooks/mollie`,
    locale: input.locale,
    demoCheckoutUrl,
  });

  const { error: payError } = await supabase
    .from("orders")
    .update({ payment_id: payment.paymentId })
    .eq("id", order.id);
  if (payError) throw payError;

  return {
    orderId: order.id,
    checkoutUrl: payment.checkoutUrl,
    confirmationToken: order.confirmation_token,
  };
}

/**
 * Idempotent payment finalizer, shared by the Mollie webhook and the demo
 * payment page. The unique (order_id, event_type) constraint guarantees each
 * transition runs once even under duplicate/out-of-order webhook delivery.
 */
export async function finalizePayment(
  orderId: string,
  status: PaymentStatus,
): Promise<{ applied: boolean }> {
  if (status === "open") return { applied: false };
  const supabase = createAdminClient();

  const { error: eventError } = await supabase
    .from("order_events")
    .insert({ order_id: orderId, event_type: `payment_${status}` });
  if (eventError) {
    // 23505 = unique violation -> this transition was already processed
    if ((eventError as { code?: string }).code === "23505") {
      return { applied: false };
    }
    throw eventError;
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items (*)")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  if (order.status !== "pending") return { applied: false };

  if (status !== "paid") {
    const mapped = status === "canceled" ? "cancelled" : status;
    await supabase.from("orders").update({ status: mapped }).eq("id", orderId);
    return { applied: true };
  }

  // paid: decrement stock (shortages are logged, not blocking — a real shop
  // would trigger a refund/backorder flow here)
  for (const item of order.order_items as unknown as {
    variant_id: string | null;
    quantity: number;
    sku: string;
  }[]) {
    if (!item.variant_id) continue;
    const { data: ok } = await supabase.rpc("decrement_stock", {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    });
    if (!ok) {
      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: `stock_shortage_${item.sku}`,
        payload: { sku: item.sku, quantity: item.quantity } as unknown as Json,
      });
    }
  }

  await supabase.from("orders").update({ status: "paid" }).eq("id", orderId);

  if (order.cart_id) {
    await supabase
      .from("carts")
      .update({ status: "converted" })
      .eq("id", order.cart_id);
  }

  if (order.promo_code) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("id, use_count")
      .eq("code", order.promo_code)
      .maybeSingle();
    if (promo) {
      await supabase
        .from("promo_codes")
        .update({ use_count: promo.use_count + 1 })
        .eq("id", promo.id);
    }
  }

  const locale = (order.locale === "en" ? "en" : "nl") as "nl" | "en";
  const lines = (order.order_items as unknown as {
    product_name: Json;
    quantity: number;
  }[])
    .map((i) => `  ${i.quantity}x ${lt(i.product_name as never, locale)}`)
    .join("\n");
  await getEmailAdapter()
    .send({
      to: order.email,
      subject:
        locale === "nl"
          ? `Bevestiging bestelling ${order.order_number} (demo)`
          : `Order confirmation ${order.order_number} (demo)`,
      text:
        (locale === "nl"
          ? `Bedankt voor je demo-bestelling bij Vondel Cycles!\n\n`
          : `Thanks for your demo order at Vondel Cycles!\n\n`) +
        `${lines}\n\nTotaal / Total: €${(order.total_incl_cents / 100).toFixed(2)}\n` +
        absoluteUrl(locale, {
          pathname: "/bestelling/[orderId]",
          params: { orderId: order.id },
        }) +
        `?token=${order.confirmation_token}`,
    })
    .catch((err) => console.error("[email] confirmation failed:", err));

  return { applied: true };
}

export interface OrderConfirmation {
  id: string;
  orderNumber: string;
  status: string;
  email: string;
  totalInclCents: number;
  subtotalExclCents: number;
  shippingCostCents: number;
  promoDiscountCents: number;
  vatBreakdown: Record<string, number>;
  reverseCharge: boolean;
  shippingAddress: Address;
  pickupPoint: { name: string; street: string; city: string } | null;
  items: {
    productName: Record<string, string>;
    sku: string;
    quantity: number;
    unitPriceExclCents: number;
    vatRate: number;
    imagePath: string | null;
    unitPriceInclCents: number;
  }[];
}

/** Guest-safe order lookup: requires the confirmation token. */
export async function getOrderForConfirmation(
  orderId: string,
  token: string,
): Promise<OrderConfirmation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items (*)")
    .eq("id", orderId)
    .eq("confirmation_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    orderNumber: data.order_number,
    status: data.status,
    email: data.email,
    totalInclCents: data.total_incl_cents,
    subtotalExclCents: data.subtotal_excl_cents,
    shippingCostCents: data.shipping_cost_cents,
    promoDiscountCents: data.promo_discount_cents,
    vatBreakdown: data.vat_breakdown as Record<string, number>,
    reverseCharge: data.reverse_charge,
    shippingAddress: data.shipping_address as unknown as Address,
    pickupPoint: data.pickup_point as OrderConfirmation["pickupPoint"],
    items: (data.order_items as unknown as never[]).map(
      (i: {
        product_name: Record<string, string>;
        sku: string;
        quantity: number;
        unit_price_excl_cents: number;
        vat_rate: number;
        image_path: string | null;
      }) => ({
        productName: i.product_name,
        sku: i.sku,
        quantity: i.quantity,
        unitPriceExclCents: i.unit_price_excl_cents,
        vatRate: i.vat_rate,
        imagePath: i.image_path,
        unitPriceInclCents: inclBtwCents(i.unit_price_excl_cents, i.vat_rate),
      }),
    ),
  };
}
