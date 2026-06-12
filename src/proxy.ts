import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // intl first (may redirect/rewrite), then refresh the Supabase session
  // onto whatever response intl produced.
  const response = intlMiddleware(request);
  return updateSession(request, response);
}

export const config = {
  // Skip api routes, static files and the non-localized admin area
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
