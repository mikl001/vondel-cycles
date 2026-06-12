import type { NextRequest } from "next/server";

/**
 * CSRF guard for state-changing API routes: the Origin header (set by
 * browsers on cross-origin and same-origin POST/PATCH/DELETE) must match
 * the request host. Requests without Origin (curl, server-to-server with
 * explicit keys) are allowed — cookies are what CSRF abuses, and those
 * only flow from browsers, which do send Origin.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
