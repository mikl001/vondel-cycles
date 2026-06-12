import { NextResponse } from "next/server";

import { resolveCartIdentity } from "@/lib/cart/identity";
import { buildCartView } from "@/lib/cart/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EMPTY_CART } from "@/types/cart";

export async function GET() {
  try {
    const { cartId } = await resolveCartIdentity();
    if (!cartId) return NextResponse.json(EMPTY_CART);
    return NextResponse.json(await buildCartView(createAdminClient(), cartId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[cart] GET failed:", err);
    return NextResponse.json(EMPTY_CART, { status: 200 });
  }
}
