import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Lands email links (magic link, signup confirmation, password recovery):
 *  verifies the token hash and redirects into the localized app. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/nl/account";
  // Only allow same-site relative redirects. Require a single leading slash
  // followed by a non-slash/non-backslash char: this rejects "//evil.com" AND
  // "/\evil.com" (WHATWG treats the backslash as an authority separator, so a
  // naive startsWith("//") guard would let it through as an open redirect).
  const next = /^\/[^/\\]/.test(rawNext) ? rawNext : "/nl";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }
  return NextResponse.redirect(new URL("/nl/login?error=link", request.url));
}
