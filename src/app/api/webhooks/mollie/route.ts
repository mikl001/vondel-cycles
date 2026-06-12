import { NextRequest, NextResponse } from "next/server";

import { getPaymentAdapter } from "@/lib/adapters/payments";
import { finalizePayment } from "@/lib/orders/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Mollie webhook: the body only carries a payment id — the actual status is
 * always fetched from the Mollie API (documented secure pattern). Duplicate
 * and out-of-order deliveries are absorbed by finalizePayment's idempotency.
 * Always answers 200 so Mollie stops retrying invalid ids.
 */
export async function POST(request: NextRequest) {
  let paymentId = "";
  try {
    const form = await request.formData();
    paymentId = String(form.get("id") ?? "");
  } catch {
    return new NextResponse("ok");
  }
  if (!paymentId || paymentId.length > 64) return new NextResponse("ok");

  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle();
    if (!order) return new NextResponse("ok");

    const status = await getPaymentAdapter().getPaymentStatus(paymentId);
    await finalizePayment(order.id, status);
  } catch (err) {
    console.error("[webhook mollie] failed:", err);
    // 500 makes Mollie retry later — correct for transient failures
    return new NextResponse("error", { status: 500 });
  }
  return new NextResponse("ok");
}
