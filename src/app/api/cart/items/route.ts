import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { resolveCartIdentity } from "@/lib/cart/identity";
import {
  addItem,
  buildCartView,
  CART_COOKIE,
  createGuestCart,
} from "@/lib/cart/server";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await rateLimit(request, "cart", LIMITS.cartMutation))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { variantId?: unknown; quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const variantId = typeof body.variantId === "string" ? body.variantId : "";
  const quantity = Number.isInteger(body.quantity) ? (body.quantity as number) : 1;
  if (!UUID_RE.test(variantId) || quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const identity = await resolveCartIdentity();

    let cartId = identity.cartId;
    let newGuestToken: string | null = null;
    if (!cartId) {
      // guest without a cart yet: mint a token + cart
      newGuestToken = identity.token ?? randomUUID();
      cartId = await createGuestCart(supabase, newGuestToken);
    }

    const { adjusted } = await addItem(supabase, cartId, variantId, quantity);
    const view = await buildCartView(supabase, cartId);

    const response = NextResponse.json(
      { ...view, adjusted },
      { headers: { "Cache-Control": "no-store" } },
    );
    if (newGuestToken) {
      response.cookies.set(CART_COOKIE, newGuestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 90, // 90 days
      });
    }
    return response;
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    if (status === 500) console.error("[cart] POST failed:", err);
    return NextResponse.json(
      { error: status === 409 ? "out_of_stock" : "error" },
      { status },
    );
  }
}
