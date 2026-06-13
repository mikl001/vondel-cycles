import "server-only";

import { calculateTotals, type PricedItem } from "@/lib/cart/totals";
import { inclBtwCents } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartItemView, CartView } from "@/types/cart";
import type { LocalizedText, VariantOption } from "@/types/catalog";

export const CART_COOKIE = "vc_cart";

type Admin = ReturnType<typeof createAdminClient>;

/** Raw shape of the joined cart items query (hand-cast, see queries.ts). */
interface RawCartItem {
  id: string;
  variant_id: string;
  quantity: number;
  product_variants: {
    sku: string;
    options: Record<string, VariantOption> | null;
    price_cents: number | null;
    stock_quantity: number;
    products: {
      id: string;
      slug: LocalizedText;
      name: LocalizedText;
      brand: string;
      vat_rate: number;
      base_price_cents: number;
      status: string;
      product_images: { storage_path: string; sort_order: number }[];
    };
  };
}

async function fetchCartItems(supabase: Admin, cartId: string): Promise<RawCartItem[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `id, variant_id, quantity,
       product_variants (
         sku, options, price_cents, stock_quantity,
         products (
           id, slug, name, brand, vat_rate, base_price_cents, status,
           product_images (storage_path, sort_order)
         )
       )`,
    )
    .eq("cart_id", cartId)
    .order("created_at");
  if (error) throw error;
  return data as unknown as RawCartItem[];
}

export async function getCartIdByToken(
  supabase: Admin,
  token: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("anon_token", token)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function createGuestCart(
  supabase: Admin,
  token: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("carts")
    .insert({ anon_token: token })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function getCartIdByUser(
  supabase: Admin,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getOrCreateUserCart(
  supabase: Admin,
  userId: string,
): Promise<string> {
  const existing = await getCartIdByUser(supabase, userId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * On login: fold the guest cart into the user's cart (sum quantities) or,
 * when the user has no active cart, simply adopt the guest cart.
 */
export async function mergeGuestCartIntoUserCart(
  supabase: Admin,
  token: string,
  userId: string,
): Promise<void> {
  const guestCartId = await getCartIdByToken(supabase, token);
  if (!guestCartId) return;

  const userCartId = await getCartIdByUser(supabase, userId);
  if (!userCartId) {
    // Adopt the guest cart. If a concurrent request (parallel login tab, or an
    // add-to-cart) created the user's active cart in the meantime, the partial
    // unique index rejects this with 23505 — fall through to the merge path.
    const { error } = await supabase
      .from("carts")
      .update({ user_id: userId, anon_token: null })
      .eq("id", guestCartId);
    if (!error) return;
    if ((error as { code?: string }).code !== "23505") throw error;
  }

  const targetCartId = userCartId ?? (await getOrCreateUserCart(supabase, userId));
  const { data: guestItems, error } = await supabase
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("cart_id", guestCartId);
  if (error) throw error;

  for (const item of guestItems) {
    await addItem(supabase, targetCartId, item.variant_id, item.quantity).catch(
      () => {}, // out-of-stock guest leftovers are dropped silently
    );
  }
  await supabase.from("carts").delete().eq("id", guestCartId);
}

export async function buildCartView(
  supabase: Admin,
  cartId: string,
): Promise<CartView> {
  const raw = await fetchCartItems(supabase, cartId);

  const items: CartItemView[] = raw
    // archived/draft products silently drop out of the cart
    .filter((row) => row.product_variants.products.status === "active")
    .map((row) => {
      const variant = row.product_variants;
      const product = variant.products;
      const unitExcl = variant.price_cents ?? product.base_price_cents;
      const unitIncl = inclBtwCents(unitExcl, product.vat_rate);
      const image = [...product.product_images].sort(
        (a, b) => a.sort_order - b.sort_order,
      )[0];
      const priced: PricedItem = {
        unitPriceExclCents: unitExcl,
        quantity: row.quantity,
        vatRate: product.vat_rate,
      };
      return {
        id: row.id,
        variantId: row.variant_id,
        quantity: row.quantity,
        sku: variant.sku,
        options: variant.options ?? {},
        stockQuantity: variant.stock_quantity,
        productSlug: product.slug,
        productName: product.name,
        brand: product.brand,
        imagePath: image?.storage_path ?? null,
        vatRate: product.vat_rate,
        unitPriceExclCents: unitExcl,
        unitPriceInclCents: unitIncl,
        lineInclCents:
          calculateTotals([priced]).totalInclCents,
      };
    });

  const totals = calculateTotals(
    items.map((i) => ({
      unitPriceExclCents: i.unitPriceExclCents,
      quantity: i.quantity,
      vatRate: i.vatRate,
    })),
  );

  return {
    items,
    totals,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/** Add a variant (or increase its quantity), clamped to available stock. */
export async function addItem(
  supabase: Admin,
  cartId: string,
  variantId: string,
  quantity: number,
): Promise<{ adjusted: boolean }> {
  const { data: variant, error } = await supabase
    .from("product_variants")
    .select("id, stock_quantity, products (status)")
    .eq("id", variantId)
    .maybeSingle();
  if (error) throw error;
  const productStatus = (variant as unknown as { products: { status: string } } | null)
    ?.products?.status;
  if (!variant || productStatus !== "active") {
    throw Object.assign(new Error("Variant not available"), { status: 404 });
  }

  const { data: existing, error: err2 } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();
  if (err2) throw err2;

  const wanted = (existing?.quantity ?? 0) + quantity;
  const clamped = Math.max(1, Math.min(wanted, variant.stock_quantity, 99));
  if (variant.stock_quantity === 0) {
    throw Object.assign(new Error("Out of stock"), { status: 409 });
  }

  if (existing) {
    const { error: err3 } = await supabase
      .from("cart_items")
      .update({ quantity: clamped })
      .eq("id", existing.id);
    if (err3) throw err3;
  } else {
    const { error: err3 } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, variant_id: variantId, quantity: clamped });
    if (err3) throw err3;
  }
  return { adjusted: clamped !== wanted };
}

export async function setItemQuantity(
  supabase: Admin,
  cartId: string,
  itemId: string,
  quantity: number,
): Promise<{ adjusted: boolean }> {
  const { data: item, error } = await supabase
    .from("cart_items")
    .select("id, variant_id, product_variants (stock_quantity)")
    .eq("id", itemId)
    .eq("cart_id", cartId)
    .maybeSingle();
  if (error) throw error;
  if (!item) throw Object.assign(new Error("Item not found"), { status: 404 });

  const stock = (item as unknown as { product_variants: { stock_quantity: number } })
    .product_variants.stock_quantity;
  const clamped = Math.max(1, Math.min(quantity, stock, 99));
  const { error: err2 } = await supabase
    .from("cart_items")
    .update({ quantity: clamped })
    .eq("id", itemId);
  if (err2) throw err2;
  return { adjusted: clamped !== quantity };
}

export async function removeItem(
  supabase: Admin,
  cartId: string,
  itemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cartId);
  if (error) throw error;
}
