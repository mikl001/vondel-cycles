export interface PickupPoint {
  id: string;
  name: string;
  street: string;
  city: string;
  postcode: string;
  distanceKm: number;
}

export interface ShippingAdapter {
  /** Sendcloud-like pickup point search around a postcode */
  getPickupPoints(postcode: string): Promise<PickupPoint[]>;
}

const POINT_NAMES = [
  "Primera", "Bruna", "Albert Heijn", "Jumbo City", "GAMMA",
  "The Read Shop", "Kiosk Centraal", "Spar Buurtwinkel",
];

/**
 * Deterministic mock of a pickup-point API. Real Sendcloud/PostNL APIs slot
 * in behind the same interface (id format matches what labels would need).
 */
export const mockShippingAdapter: ShippingAdapter = {
  async getPickupPoints(postcode) {
    const clean = postcode.replace(/\s/g, "").toUpperCase();
    const digits = Number(clean.slice(0, 4)) || 1012;
    return Array.from({ length: 3 }, (_, i) => {
      const n = (digits + i * 37) % POINT_NAMES.length;
      return {
        id: `pp-${clean}-${i + 1}`,
        name: `${POINT_NAMES[n]} ${["Centrum", "West", "Zuid"][i]}`,
        street: `${["Hoofdstraat", "Marktplein", "Stationsplein"][i]} ${(digits % 90) + i * 3 + 1}`,
        city: "Naburige stad",
        postcode: `${String(digits).padStart(4, "0")} ${["AB", "CD", "EF"][i]}`,
        distanceKm: Math.round((0.4 + i * 0.7) * 10) / 10,
      };
    });
  },
};

export function getShippingAdapter(): ShippingAdapter {
  return mockShippingAdapter;
}

/** Shipping cost for a method given the order's incl-BTW product total. */
export function shippingCostCents(
  method: { price_cents: number; free_above_cents: number | null },
  productTotalInclCents: number,
): number {
  if (
    method.free_above_cents != null &&
    productTotalInclCents >= method.free_above_cents
  ) {
    return 0;
  }
  return method.price_cents;
}
