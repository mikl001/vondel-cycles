import { NextRequest, NextResponse } from "next/server";

import { finalizePayment } from "@/lib/orders/server";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Demo payment confirmation (local stand-in for Mollie's hosted checkout).
 * Authorized by the order's confirmation token; only mock-provider orders
 * can be transitioned this way.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await rateLimit(request, "mock-pay", LIMITS.mockPayment))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { orderId?: string; token?: string; outcome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const outcome = body.outcome === "paid" ? "paid" : "canceled";
  if (!body.orderId || !body.token) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_provider")
      .eq("id", body.orderId)
      .eq("confirmation_token", body.token)
      .maybeSingle();
    if (!order || order.payment_provider !== "mock") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    await finalizePayment(order.id, outcome);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mock payment] failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
