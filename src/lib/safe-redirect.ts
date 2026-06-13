/**
 * Resolve a `next` redirect target to a same-origin path, or the fallback.
 *
 * Pure and parser-based on purpose: string/regex guards are bypassable because
 * the WHATWG URL parser strips tab/CR/LF and treats backslashes as slashes, so
 * inputs like "/\t//evil.com" sneak past a char check yet resolve off-origin.
 * Parsing against our own origin and comparing the resolved origin is robust.
 */
export function resolveSafeNext(
  rawNext: string,
  origin: string,
  fallback = "/nl",
): string {
  try {
    const candidate = new URL(rawNext, origin);
    if (candidate.origin === origin) {
      return candidate.pathname + candidate.search + candidate.hash;
    }
  } catch {
    /* malformed — fall through */
  }
  return fallback;
}
