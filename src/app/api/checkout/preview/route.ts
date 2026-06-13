import { NextRequest, NextResponse } from "next/server";

import { resolveCartIdentity } from "@/lib/cart/identity";
import {
  CheckoutError,
  priceCheckout,
  qualifiesForReverseCharge,
} from "@/lib/orders/server";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

/** Server-priced totals for the checkout summary (same path as the order). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await rateLimit(request, "preview", LIMITS.preview))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { cartId } = await resolveCartIdentity();
  if (!cartId) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  let body: {
    shippingMethodCode?: string;
    promoCode?: string;
    customerType?: string;
    vatNumber?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const priced = await priceCheckout(createAdminClient(), cartId, {
      shippingMethodCode: body.shippingMethodCode ?? "postnl-standard",
      promoCode: body.promoCode || undefined,
      reverseCharge: qualifiesForReverseCharge(
        body.customerType === "b2b" ? "b2b" : "b2c",
        body.vatNumber,
      ),
    });
    return NextResponse.json(
      { totals: priced.totals },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.code }, { status: 400 });
    }
    console.error("[checkout preview] failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
