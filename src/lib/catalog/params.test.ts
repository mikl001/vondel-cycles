import { describe, expect, it } from "vitest";

import { activeFilterCount, parseCatalogParams } from "@/lib/catalog/params";

describe("parseCatalogParams", () => {
  it("parses attribute filters from non-reserved params", () => {
    const filters = parseCatalogParams({
      kleur: "zwart,rood",
      materiaal: "staal",
      sort: "price_asc",
    });
    expect(filters.attrs).toEqual({
      kleur: ["zwart", "rood"],
      materiaal: ["staal"],
    });
    expect(filters.sort).toBe("price_asc");
  });

  it("parses the price range in euros to cents", () => {
    const filters = parseCatalogParams({ price: "100-500" });
    expect(filters.priceMinCents).toBe(10000);
    expect(filters.priceMaxCents).toBe(50000);
  });

  it("handles open-ended price ranges", () => {
    expect(parseCatalogParams({ price: "100-" }).priceMaxCents).toBeUndefined();
    expect(parseCatalogParams({ price: "-500" }).priceMinCents).toBeUndefined();
  });

  it("ignores invalid sort and page values", () => {
    const filters = parseCatalogParams({ sort: "evil", page: "abc" });
    expect(filters.sort).toBeUndefined();
    expect(filters.page).toBe(1);
  });

  it("ignores non-numeric price input", () => {
    const filters = parseCatalogParams({ price: "abc-def" });
    expect(filters.priceMinCents).toBeUndefined();
    expect(filters.priceMaxCents).toBeUndefined();
  });

  it("flags in-stock only", () => {
    expect(parseCatalogParams({ stock: "1" }).inStockOnly).toBe(true);
    expect(parseCatalogParams({}).inStockOnly).toBe(false);
  });
});

describe("activeFilterCount", () => {
  it("counts attrs, price and stock as filters", () => {
    expect(
      activeFilterCount(
        parseCatalogParams({ kleur: "zwart", price: "10-20", stock: "1" }),
      ),
    ).toBe(3);
    expect(activeFilterCount(parseCatalogParams({}))).toBe(0);
  });
});
