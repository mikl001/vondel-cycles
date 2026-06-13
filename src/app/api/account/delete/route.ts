import { NextRequest, NextResponse } from "next/server";

import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * AVG/GDPR right to erasure. Orders are anonymized rather than deleted —
 * invoice data falls under the Dutch fiscal retention duty (7 years); the
 * link to the person is removed.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await rateLimit(request, "account", LIMITS.account))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // anonymize orders before the cascade wipes profile/addresses/wishlist
    await admin
      .from("orders")
      .update({
        user_id: null,
        email: "verwijderd@anoniem.invalid",
        shipping_address: { anonymized: true },
        billing_address: { anonymized: true },
      })
      .eq("user_id", user.id);

    await supabase.auth.signOut();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[account delete] failed:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
