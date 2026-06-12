import { describe, expect, it } from "vitest";

import {
  calculateOrderTotals,
  calculateTotals,
  lineVatCents,
} from "@/lib/cart/totals";

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

describe("calculateOrderTotals", () => {
  const bike = { unitPriceExclCents: 100000, quantity: 1, vatRate: 21 };
  const book = { unitPriceExclCents: 2000, quantity: 1, vatRate: 9 };

  it("adds shipping at 21%", () => {
    const t = calculateOrderTotals([bike], { shippingExclCents: 409 });
    expect(t.shippingVatCents).toBe(86);
    expect(t.vatBreakdown["21"]).toBe(21000 + 86);
    expect(t.totalInclCents).toBe(100000 + 409 + 21086);
  });

  it("allocates a percent discount across rate groups proportionally", () => {
    const t = calculateOrderTotals([bike, book], {
      discount: { type: "percent", value: 10 },
    });
    expect(t.discountExclCents).toBe(10200);
    // bases after discount: 21% -> 90000, 9% -> 1800; allocation sums exactly
    expect(t.vatBreakdown["21"]).toBe(Math.round(90000 * 0.21));
    expect(t.vatBreakdown["9"]).toBe(Math.round(1800 * 0.09));
    expect(t.totalInclCents).toBe(
      102000 - 10200 + t.vatTotalCents,
    );
  });

  it("caps a fixed discount at the subtotal", () => {
    const t = calculateOrderTotals([book], {
      discount: { type: "fixed", value: 99999 },
    });
    expect(t.discountExclCents).toBe(2000);
    expect(t.totalInclCents).toBe(0);
  });

  it("zeroes all VAT under reverse charge", () => {
    const t = calculateOrderTotals([bike, book], {
      shippingExclCents: 409,
      reverseCharge: true,
    });
    expect(t.vatTotalCents).toBe(0);
    expect(t.totalInclCents).toBe(102000 + 409);
  });

  it("discount allocation always sums exactly (largest remainder)", () => {
    // 3 cents discount over two groups with awkward shares
    const t = calculateOrderTotals(
      [
        { unitPriceExclCents: 100, quantity: 1, vatRate: 21 },
        { unitPriceExclCents: 200, quantity: 1, vatRate: 9 },
      ],
      { discount: { type: "fixed", value: 3 } },
    );
    expect(t.discountExclCents).toBe(3);
    const taxable = 300 - 3;
    expect(t.totalInclCents - t.vatTotalCents).toBe(taxable);
  });
});
