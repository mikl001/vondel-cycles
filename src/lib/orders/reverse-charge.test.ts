import { describe, expect, it } from "vitest";

import { qualifiesForReverseCharge } from "@/lib/orders/reverse-charge";

describe("qualifiesForReverseCharge", () => {
  it("is false for B2C regardless of VAT number", () => {
    expect(qualifiesForReverseCharge("b2c", undefined)).toBe(false);
    expect(qualifiesForReverseCharge("b2c", "DE123456789")).toBe(false);
  });

  it("is false for B2B without a VAT number", () => {
    expect(qualifiesForReverseCharge("b2b", undefined)).toBe(false);
    expect(qualifiesForReverseCharge("b2b", "")).toBe(false);
  });

  it("is false for a Dutch (domestic) VAT number", () => {
    expect(qualifiesForReverseCharge("b2b", "NL123456789B01")).toBe(false);
    expect(qualifiesForReverseCharge("b2b", "nl123456789b01")).toBe(false);
  });

  it("is true for a syntactically valid non-NL EU VAT number", () => {
    expect(qualifiesForReverseCharge("b2b", "DE123456789")).toBe(true);
    expect(qualifiesForReverseCharge("b2b", "BE0123456789")).toBe(true);
    expect(qualifiesForReverseCharge("b2b", "FR12345678901")).toBe(true);
    // tolerant of spaces/dots
    expect(qualifiesForReverseCharge("b2b", "DE 123.456.789")).toBe(true);
  });

  it("is false for a non-EU / malformed VAT number", () => {
    expect(qualifiesForReverseCharge("b2b", "US123456789")).toBe(false);
    expect(qualifiesForReverseCharge("b2b", "GB123")).toBe(false);
    expect(qualifiesForReverseCharge("b2b", "not-a-vat")).toBe(false);
  });
});
