export interface AddressLookupResult {
  street: string;
  city: string;
}

export interface PostcodeAdapter {
  /** Dutch postcode (1234 AB) + house number -> street/city, null if unknown */
  lookup(postcode: string, houseNumber: string): Promise<AddressLookupResult | null>;
}

export const NL_POSTCODE_RE = /^[1-9][0-9]{3}\s?[A-Z]{2}$/i;

const STREETS = [
  "Lindenlaan", "Dorpsstraat", "Kerkweg", "Molenpad", "Wilgenhof",
  "Stationsweg", "Beukenlaan", "Havenkade", "Tulpstraat", "Polderweg",
  "Vondelstraat", "Grachtengordel", "Zonnedauw", "Eikenhout", "Meerweg",
];

const CITIES = [
  "Amsterdam", "Utrecht", "Rotterdam", "Den Haag", "Eindhoven",
  "Haarlem", "Groningen", "Leiden", "Delft", "Zwolle",
];

/**
 * Deterministic mock of a Dutch postcode API (postcode + huisnummer ->
 * street + city, the autofill every NL shopper expects). Same input always
 * yields the same address. Swap for the real thing via this interface.
 */
export const mockPostcodeAdapter: PostcodeAdapter = {
  async lookup(postcode, houseNumber) {
    const clean = postcode.replace(/\s/g, "").toUpperCase();
    if (!NL_POSTCODE_RE.test(clean) || !/^\d{1,5}/.test(houseNumber.trim())) {
      return null;
    }
    const digits = Number(clean.slice(0, 4));
    return {
      street: STREETS[digits % STREETS.length],
      city: CITIES[digits % CITIES.length],
    };
  },
};

export function getPostcodeAdapter(): PostcodeAdapter {
  // a real adapter (e.g. postcode.tech) would be selected via env here
  return mockPostcodeAdapter;
}
