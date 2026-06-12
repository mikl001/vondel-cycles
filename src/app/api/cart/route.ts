import { NextRequest, NextResponse } from "next/server";

import { buildCartView, CART_COOKIE, getCartIdByToken } from "@/lib/cart/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_CART } from "@/types/cart";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const token = request.cookies.get(CART_COOKIE)?.value;
  if (!token || !UUID_RE.test(token)) {
    return NextResponse.json(EMPTY_CART);
  }

  try {
    const supabase = createAdminClient();
    const cartId = await getCartIdByToken(supabase, token);
    if (!cartId) return NextResponse.json(EMPTY_CART);
    return NextResponse.json(await buildCartView(supabase, cartId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[cart] GET failed:", err);
    return NextResponse.json(EMPTY_CART, { status: 200 });
  }
}
