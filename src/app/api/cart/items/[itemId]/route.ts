import { NextRequest, NextResponse } from "next/server";

import {
  buildCartView,
  CART_COOKIE,
  getCartIdByToken,
  removeItem,
  setItemQuantity,
} from "@/lib/cart/server";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Context = { params: Promise<{ itemId: string }> };

async function resolveCart(request: NextRequest) {
  const token = request.cookies.get(CART_COOKIE)?.value;
  if (!token || !UUID_RE.test(token)) return null;
  const supabase = createAdminClient();
  const cartId = await getCartIdByToken(supabase, token);
  return cartId ? { supabase, cartId } : null;
}

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { itemId } = await params;
  if (!UUID_RE.test(itemId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let body: { quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const quantity = Number.isInteger(body.quantity) ? (body.quantity as number) : NaN;
  if (!(quantity >= 1 && quantity <= 99)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const ctx = await resolveCart(request);
    if (!ctx) return NextResponse.json({ error: "No cart" }, { status: 404 });
    const { adjusted } = await setItemQuantity(ctx.supabase, ctx.cartId, itemId, quantity);
    const view = await buildCartView(ctx.supabase, ctx.cartId);
    return NextResponse.json(
      { ...view, adjusted },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    if (status === 500) console.error("[cart] PATCH failed:", err);
    return NextResponse.json({ error: "error" }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { itemId } = await params;
  if (!UUID_RE.test(itemId)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const ctx = await resolveCart(request);
    if (!ctx) return NextResponse.json({ error: "No cart" }, { status: 404 });
    await removeItem(ctx.supabase, ctx.cartId, itemId);
    const view = await buildCartView(ctx.supabase, ctx.cartId);
    return NextResponse.json(view, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[cart] DELETE failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
