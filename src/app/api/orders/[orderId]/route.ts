import { NextRequest, NextResponse } from "next/server";

import { getOrderForConfirmation } from "@/lib/orders/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Confirmation-page polling endpoint (token-gated, status only). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!UUID_RE.test(orderId) || !UUID_RE.test(token)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const order = await getOrderForConfirmation(orderId, token);
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(
      { status: order.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[order status] failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
