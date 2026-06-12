import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { NextRequest, NextResponse } from "next/server";

import { InvoiceDocument } from "@/lib/invoices/invoice-document";
import { getOrderForConfirmation } from "@/lib/orders/server";

// @react-pdf/renderer needs Node APIs — never run this on the edge runtime
export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // the confirmation token doubles as the capability to read the invoice
    const order = await getOrderForConfirmation(orderId, token);
    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (["pending", "cancelled", "failed", "expired"].includes(order.status)) {
      return NextResponse.json({ error: "not_invoiceable" }, { status: 409 });
    }

    const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "nl";
    const buffer = await renderToBuffer(
      createElement(InvoiceDocument, { order, locale }) as ReactElement<DocumentProps>,
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="factuur-${order.orderNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[invoice] failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
