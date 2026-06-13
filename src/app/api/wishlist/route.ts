import { NextRequest, NextResponse } from "next/server";

import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Wishlist state for the current user (RLS-scoped). Anonymous -> empty. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ productIds: [], authenticated: false });

  const { data } = await supabase.from("wishlists").select("product_id");
  return NextResponse.json(
    { productIds: (data ?? []).map((w) => w.product_id), authenticated: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Toggle a product. RLS pins the row to auth.uid(). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await rateLimit(request, "wishlist", LIMITS.wishlist))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  let body: { productId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const productId = body.productId ?? "";
  if (!UUID_RE.test(productId)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlists").delete().eq("product_id", productId);
    return NextResponse.json({ wishlisted: false });
  }
  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: user.id, product_id: productId });
  if (error) return NextResponse.json({ error: "error" }, { status: 500 });
  return NextResponse.json({ wishlisted: true });
}
