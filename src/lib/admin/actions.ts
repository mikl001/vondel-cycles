"use server";

import { revalidatePath } from "next/cache";

import { audit, requireAdmin } from "@/lib/admin/guard";
import { getPaymentAdapter } from "@/lib/adapters/payments";
import { createAdminClient } from "@/lib/supabase/admin";

const ORDER_TRANSITIONS: Record<string, string[]> = {
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  // an oversold order is auto-cancelled; let an operator finish the refund if
  // the automatic refund failed (updateOrderStatus refunds on this transition)
  cancelled: ["refunded"],
};

export async function updateProductStatus(
  productId: string,
  status: "draft" | "active" | "archived",
): Promise<void> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ status })
    .eq("id", productId);
  if (error) throw error;
  await audit(ctx, "product.status", "product", productId, { status });
  revalidatePath("/admin/products");
}

export async function updateVariantStockPrice(
  variantId: string,
  stock: number,
  priceCents: number | null,
): Promise<void> {
  const ctx = await requireAdmin();
  if (!(stock >= 0 && stock <= 9999)) throw new Error("invalid_stock");
  if (priceCents != null && !(priceCents >= 0)) throw new Error("invalid_price");
  const admin = createAdminClient();
  const { error } = await admin
    .from("product_variants")
    .update({ stock_quantity: stock, price_cents: priceCents })
    .eq("id", variantId);
  if (error) throw error;
  await audit(ctx, "variant.stock_price", "product_variant", variantId, {
    stock,
    priceCents,
  });
  revalidatePath("/admin/products");
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  const ctx = await requireAdmin();
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("status, payment_id, payment_provider")
    .eq("id", orderId)
    .single();
  if (error) throw error;

  const allowed = ORDER_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) throw new Error("invalid_transition");

  if (status === "refunded") {
    // Mollie (test) refunds go through the API; the mock provider is a no-op.
    if (order.payment_id) {
      await getPaymentAdapter().refundPayment(order.payment_id);
    }
    await admin.from("order_events").insert({
      order_id: orderId,
      event_type: "refund_issued",
      payload: { by: ctx.email } as never,
    });
  }

  const { error: err2 } = await admin
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (err2) throw err2;
  await admin.from("order_events").insert({
    order_id: orderId,
    event_type: `status_${status}`,
    payload: { by: ctx.email, from: order.status } as never,
  });
  await audit(ctx, "order.status", "order", orderId, {
    from: order.status,
    to: status,
  });
  revalidatePath("/admin/orders");
}

export async function setTrackingCode(
  orderId: string,
  trackingCode: string,
): Promise<void> {
  const ctx = await requireAdmin();
  const code = trackingCode.trim().slice(0, 64);
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ tracking_code: code || null })
    .eq("id", orderId);
  if (error) throw error;
  await audit(ctx, "order.tracking", "order", orderId, { trackingCode: code });
  revalidatePath("/admin/orders");
}
