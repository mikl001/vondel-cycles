/** Pure VAT-reverse-charge determination (no server-only deps, so it is unit
 *  testable). B2B with a syntactically valid non-NL EU VAT id qualifies for an
 *  intra-EU reverse charge (VAT shifted to the buyer). */

const EU_VAT_RE =
  /^(AT|BE|BG|HR|CY|CZ|DK|EE|FI|FR|DE|EL|HU|IE|IT|LV|LT|LU|MT|NL|PL|PT|RO|SK|SI|ES|SE)[0-9A-Z]{8,12}$/;

export function qualifiesForReverseCharge(
  customerType: "b2c" | "b2b",
  vatNumber: string | undefined,
): boolean {
  if (customerType !== "b2b" || !vatNumber) return false;
  const clean = vatNumber.replace(/[\s.]/g, "").toUpperCase();
  return EU_VAT_RE.test(clean) && !clean.startsWith("NL");
}
