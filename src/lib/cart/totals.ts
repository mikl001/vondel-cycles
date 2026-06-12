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
