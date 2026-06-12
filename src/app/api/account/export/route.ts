import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * AVG/GDPR data portability: everything we store about the user as JSON.
 * All queries run RLS-scoped through the user's own session.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const [profile, addresses, orders, wishlist] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("addresses").select("*"),
    supabase.from("orders").select("*, order_items (*)"),
    supabase.from("wishlists").select("*"),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile.data,
    addresses: addresses.data ?? [],
    orders: orders.data ?? [],
    wishlist: wishlist.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vondel-cycles-data-${user.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
