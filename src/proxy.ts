import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default function proxy(request: NextRequest) {
  // Supabase session refresh is composed here once auth lands (Phase 6).
  return intlMiddleware(request);
}

export const config = {
  // Skip api routes, static files and the non-localized admin area
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
