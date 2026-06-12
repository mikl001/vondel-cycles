import { describe, expect, it } from "vitest";

import { calculateTotals, lineVatCents } from "@/lib/cart/totals";

describe("calculateTotals", () => {
  it("computes a single 21% line", () => {
    const totals = calculateTotals([
      { unitPriceExclCents: 10000, quantity: 2, vatRate: 21 },
    ]);
    expect(totals.subtotalExclCents).toBe(20000);
    expect(totals.vatBreakdown).toEqual({ "21": 4200 });
    expect(totals.totalInclCents).toBe(24200);
  });

  it("splits the VAT breakdown across mixed rates", () => {
    // a bike (21%) and two books (9%)
    const totals = calculateTotals([
      { unitPriceExclCents: 45372, quantity: 1, vatRate: 21 },
      { unitPriceExclCents: 2293, quantity: 2, vatRate: 9 },
    ]);
    expect(totals.subtotalExclCents).toBe(45372 + 4586);
    expect(totals.vatBreakdown["21"]).toBe(Math.round(45372 * 0.21));
    expect(totals.vatBreakdown["9"]).toBe(Math.round(4586 * 0.09));
    expect(totals.totalInclCents).toBe(
      totals.subtotalExclCents + totals.vatTotalCents,
    );
  });

  it("rounds VAT per line, not per unit", () => {
    // 3 × 33 cents = 99 excl; 21% of 99 = 20.79 -> 21 (per line)
    // per-unit rounding would give 3 × round(6.93) = 21 too, so pick a case
    // where they differ: unit 5 cents, qty 3 -> line 15, vat 3.15 -> 3;
    // per-unit: 3 × round(1.05) = 3. Use 7 cents qty 3 -> line 21 -> 4.41 -> 4
    // per-unit: 3 × round(1.47) = 3 × 1 = 3 — differs.
    expect(lineVatCents({ unitPriceExclCents: 7, quantity: 3, vatRate: 21 })).toBe(4);
  });

  it("handles an empty cart", () => {
    const totals = calculateTotals([]);
    expect(totals.subtotalExclCents).toBe(0);
    expect(totals.vatTotalCents).toBe(0);
    expect(totals.totalInclCents).toBe(0);
    expect(totals.vatBreakdown).toEqual({});
  });
});
