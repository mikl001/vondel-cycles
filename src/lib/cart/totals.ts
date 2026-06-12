/**
 * Single source of truth for money math. Used by the cart API, checkout,
 * invoices and admin alike — the client never computes authoritative totals.
 *
 * Convention: prices are stored as integer cents EXCLUDING BTW; VAT is
 * computed and rounded per line (half-up), then summed per rate.
 */

export interface PricedItem {
  /** unit price excl. BTW in cents (variant override or product base price) */
  unitPriceExclCents: number;
  quantity: number;
  vatRate: number; // 21 | 9
}

export interface CartTotals {
  subtotalExclCents: number;
  /** vat rate (as string key, e.g. "21") -> vat amount in cents */
  vatBreakdown: Record<string, number>;
  vatTotalCents: number;
  totalInclCents: number;
}

export function lineExclCents(item: PricedItem): number {
  return item.unitPriceExclCents * item.quantity;
}

export function lineVatCents(item: PricedItem): number {
  return Math.round((lineExclCents(item) * item.vatRate) / 100);
}

export function calculateTotals(items: PricedItem[]): CartTotals {
  const vatBreakdown: Record<string, number> = {};
  let subtotalExclCents = 0;

  for (const item of items) {
    subtotalExclCents += lineExclCents(item);
    const key = String(item.vatRate);
    vatBreakdown[key] = (vatBreakdown[key] ?? 0) + lineVatCents(item);
  }

  const vatTotalCents = Object.values(vatBreakdown).reduce((a, b) => a + b, 0);
  return {
    subtotalExclCents,
    vatBreakdown,
    vatTotalCents,
    totalInclCents: subtotalExclCents + vatTotalCents,
  };
}

// ─── Order-level totals (checkout) ──────────────────────────────────────────

export interface Discount {
  type: "percent" | "fixed";
  /** percent: whole percents; fixed: excl-BTW cents */
  value: number;
}

export interface OrderTotals extends CartTotals {
  discountExclCents: number;
  shippingExclCents: number;
  shippingVatCents: number;
  reverseCharge: boolean;
}

/**
 * Order math: a discount reduces the taxable base of each VAT-rate group
 * proportionally to its share (largest-remainder allocation, so the parts
 * always sum exactly to the discount). Shipping is taxed at 21% — it follows
 * the main supply; one rate keeps the demo honest without a rate matrix.
 * Reverse charge (B2B, EU VAT id outside NL) zeroes all VAT.
 */
export function calculateOrderTotals(
  items: PricedItem[],
  opts: {
    shippingExclCents?: number;
    discount?: Discount | null;
    reverseCharge?: boolean;
  } = {},
): OrderTotals {
  const shippingExclCents = opts.shippingExclCents ?? 0;
  const reverseCharge = opts.reverseCharge ?? false;

  // taxable base per rate, before discount
  const baseByRate = new Map<number, number>();
  for (const item of items) {
    baseByRate.set(
      item.vatRate,
      (baseByRate.get(item.vatRate) ?? 0) + lineExclCents(item),
    );
  }
  const subtotalExclCents = [...baseByRate.values()].reduce((a, b) => a + b, 0);

  // discount, capped at the product subtotal
  let discountExclCents = 0;
  if (opts.discount && subtotalExclCents > 0) {
    discountExclCents =
      opts.discount.type === "percent"
        ? Math.round((subtotalExclCents * opts.discount.value) / 100)
        : Math.min(opts.discount.value, subtotalExclCents);
  }

  // allocate the discount across rate groups (largest remainder)
  const rates = [...baseByRate.keys()];
  const allocated = new Map<number, number>();
  if (discountExclCents > 0) {
    const exact = rates.map((rate) => ({
      rate,
      exact: (baseByRate.get(rate)! / subtotalExclCents) * discountExclCents,
    }));
    let assigned = 0;
    for (const e of exact) {
      const floor = Math.floor(e.exact);
      allocated.set(e.rate, floor);
      assigned += floor;
    }
    const remainders = exact
      .map((e) => ({ rate: e.rate, rem: e.exact - Math.floor(e.exact) }))
      .sort((a, b) => b.rem - a.rem);
    for (let i = 0; assigned < discountExclCents; i++, assigned++) {
      const rate = remainders[i % remainders.length].rate;
      allocated.set(rate, (allocated.get(rate) ?? 0) + 1);
    }
  }

  const vatBreakdown: Record<string, number> = {};
  for (const rate of rates) {
    const base = baseByRate.get(rate)! - (allocated.get(rate) ?? 0);
    const vat = reverseCharge ? 0 : Math.round((base * rate) / 100);
    if (vat > 0 || base > 0) vatBreakdown[String(rate)] = vat;
  }

  const shippingVatCents = reverseCharge
    ? 0
    : Math.round((shippingExclCents * 21) / 100);
  if (shippingExclCents > 0) {
    vatBreakdown["21"] = (vatBreakdown["21"] ?? 0) + shippingVatCents;
  }

  const vatTotalCents = Object.values(vatBreakdown).reduce((a, b) => a + b, 0);
  const taxableExcl = subtotalExclCents - discountExclCents + shippingExclCents;

  return {
    subtotalExclCents,
    discountExclCents,
    shippingExclCents,
    shippingVatCents,
    vatBreakdown,
    vatTotalCents,
    totalInclCents: taxableExcl + vatTotalCents,
    reverseCharge,
  };
}
