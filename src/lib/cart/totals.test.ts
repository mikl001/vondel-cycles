import { describe, expect, it } from "vitest";

import {
  calculateOrderTotals,
  calculateTotals,
  lineVatCents,
  unitVatCents,
} from "@/lib/cart/totals";
import { inclBtwCents } from "@/lib/format";

describe("calculateTotals", () => {
  it("computes a single 21% line", () => {
    const totals = calculateTotals([
      { unitPriceExclCents: 10000, quantity: 2, vatRate: 21 },
    ]);
    expect(totals.subtotalExclCents).toBe(20000);
    expect(totals.vatBreakdown).toEqual({ "21": 4200 });
    expect(totals.totalInclCents).toBe(24200);
  });

  it("splits the VAT breakdown across mixed rates (unit-rounded)", () => {
    // a bike (21%) and two books (9%)
    const totals = calculateTotals([
      { unitPriceExclCents: 45372, quantity: 1, vatRate: 21 },
      { unitPriceExclCents: 2293, quantity: 2, vatRate: 9 },
    ]);
    expect(totals.subtotalExclCents).toBe(45372 + 4586);
    expect(totals.vatBreakdown["21"]).toBe(unitVatCents(45372, 21));
    // unit-rounded: 2 × round(2293 × 0.09), NOT round(4586 × 0.09)
    expect(totals.vatBreakdown["9"]).toBe(2 * unitVatCents(2293, 9));
    expect(totals.totalInclCents).toBe(
      totals.subtotalExclCents + totals.vatTotalCents,
    );
  });

  it("rounds VAT per unit then multiplies by quantity", () => {
    // unit 7 cents, qty 3: per-unit 3 × round(1.47)=3 × 1 = 3
    // (line-rounding would give round(21 × 0.21)=round(4.41)=4 — we use per-unit)
    expect(lineVatCents({ unitPriceExclCents: 7, quantity: 3, vatRate: 21 })).toBe(3);
  });

  it("keeps line totals reconciling: unitIncl × qty sums exactly to the total", () => {
    const items = [
      { unitPriceExclCents: 45372, quantity: 1, vatRate: 21 },
      { unitPriceExclCents: 57769, quantity: 3, vatRate: 21 },
      { unitPriceExclCents: 2293, quantity: 2, vatRate: 9 },
    ];
    const totals = calculateTotals(items);
    const sumOfLines = items.reduce(
      (sum, i) => sum + inclBtwCents(i.unitPriceExclCents, i.vatRate) * i.quantity,
      0,
    );
    expect(sumOfLines).toBe(totals.totalInclCents);
  });

  it("handles an empty cart", () => {
    const totals = calculateTotals([]);
    expect(totals.subtotalExclCents).toBe(0);
    expect(totals.vatTotalCents).toBe(0);
    expect(totals.totalInclCents).toBe(0);
    expect(totals.vatBreakdown).toEqual({});
  });
});

describe("cart preview and charged order agree to the cent", () => {
  // The headline invariant: with no shipping/discount, the cart total
  // (calculateTotals) must equal the order total (calculateOrderTotals).
  const cases = [
    // the two default 21% seed bikes — the exact regression from review round 1
    [
      { unitPriceExclCents: 45372, quantity: 1, vatRate: 21 },
      { unitPriceExclCents: 57769, quantity: 1, vatRate: 21 },
    ],
    // quantities > 1 at the same rate, where line-rounding would have drifted
    [
      { unitPriceExclCents: 2293, quantity: 3, vatRate: 9 },
      { unitPriceExclCents: 2293, quantity: 2, vatRate: 9 },
    ],
    // mixed rates and quantities
    [
      { unitPriceExclCents: 45372, quantity: 2, vatRate: 21 },
      { unitPriceExclCents: 1653, quantity: 4, vatRate: 9 },
      { unitPriceExclCents: 57769, quantity: 1, vatRate: 21 },
    ],
  ];

  it.each(cases)("matches for case %#", (...items) => {
    const cart = calculateTotals(items);
    const order = calculateOrderTotals(items, {});
    expect(order.totalInclCents).toBe(cart.totalInclCents);
    expect(order.vatBreakdown).toEqual(cart.vatBreakdown);
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
    expect(t.totalInclCents).toBe(102000 - 10200 + t.vatTotalCents);
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

  it("reverse-charge totals foot to subtotal + shipping (no VAT)", () => {
    // the confirmation/invoice present excl line totals under reverse charge,
    // so subtotalExcl + shipping must equal the grand total with VAT == 0
    const t = calculateOrderTotals(
      [
        { unitPriceExclCents: 45372, quantity: 2, vatRate: 21 },
        { unitPriceExclCents: 2293, quantity: 3, vatRate: 9 },
      ],
      { shippingExclCents: 495, reverseCharge: true },
    );
    const subtotalExcl = 45372 * 2 + 2293 * 3;
    expect(t.subtotalExclCents).toBe(subtotalExcl);
    expect(t.vatTotalCents).toBe(0);
    expect(t.totalInclCents).toBe(subtotalExcl + 495);
    // every VAT-breakdown entry is zero under reverse charge
    expect(Object.values(t.vatBreakdown).every((c) => c === 0)).toBe(true);
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
