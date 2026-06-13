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
  // Resolve `next` with the SAME parser the redirect uses and accept it only if
  // it stays on our origin. String/regex guards are not enough: the WHATWG URL
  // parser strips tab/CR/LF, so e.g. "/\t//evil.com" sneaks past a char check
  // yet resolves to evil.com. Comparing the parsed origin is bypass-proof.
  const origin = request.nextUrl.origin;
  let next = "/nl";
  try {
    const candidate = new URL(rawNext, origin);
    if (candidate.origin === origin) {
      next = candidate.pathname + candidate.search + candidate.hash;
    }
  } catch {
    next = "/nl";
  }

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
