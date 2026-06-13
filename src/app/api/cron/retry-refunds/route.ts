import { NextRequest, NextResponse } from "next/server";

import { getPaymentAdapter } from "@/lib/adapters/payments";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Reconciliation sweep for oversold orders whose automatic refund failed
 * (status='cancelled' with a 'refund_failed' event and no 'refunded' event).
 * Retries the refund and, on success, advances the order to 'refunded'. Wire
 * as a Vercel cron alongside abandoned-carts; protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // orders flagged refund_failed that have not yet been refunded
  const { data: failed, error } = await admin
    .from("order_events")
    .select("order_id")
    .eq("event_type", "refund_failed")
    .limit(200);
  if (error) {
    console.error("[retry-refunds] query failed:", error);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }

  const adapter = getPaymentAdapter();
  let retried = 0;
  let recovered = 0;
  const seen = new Set<string>();

  for (const row of failed) {
    if (seen.has(row.order_id)) continue;
    seen.add(row.order_id);

    const { data: order } = await admin
      .from("orders")
      .select("id, status, payment_id")
      .eq("id", row.order_id)
      .maybeSingle();
    // only retry orders still stuck cancelled (not already refunded)
    if (!order || order.status !== "cancelled" || !order.payment_id) continue;

    retried++;
    try {
      await adapter.refundPayment(order.payment_id);
      // conditional flip: only if still 'cancelled' (optimistic concurrency)
      await admin
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", order.id)
        .eq("status", "cancelled");
      await admin
        .from("order_events")
        .insert({ order_id: order.id, event_type: "refunded" })
        .then(undefined, () => {});
      recovered++;
    } catch (err) {
      console.error(`[retry-refunds] still failing for ${order.id}:`, err);
    }
  }

  return NextResponse.json({ retried, recovered });
}
