/**
 * Client IP extraction from a bare Headers object — pure (no server-only deps,
 * so it is unit testable and usable from Server Actions too).
 *
 * Assumes a single trusted proxy (Vercel). The platform sets `x-real-ip` to the
 * true client and APPENDS the real client to `x-forwarded-for`, so we must NOT
 * trust the LEFTMOST x-forwarded-for value — a client can prefix its own
 * spoofed entry there to evade per-IP limits. Prefer x-real-ip, then the
 * RIGHTMOST x-forwarded-for hop (the one the trusted proxy appended).
 */
export function ipFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
