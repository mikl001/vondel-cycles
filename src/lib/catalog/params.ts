import type { CatalogFilters, SortOption } from "@/lib/catalog/queries";

export type SearchParams = Record<string, string | string[] | undefined>;

const RESERVED = new Set(["page", "sort", "price", "stock", "q"]);
const SORTS: SortOption[] = ["newest", "price_asc", "price_desc", "name", "relevance"];

/**
 * URL state for catalog listings:
 *   ?kleur=zwart,rood&materiaal=staal  attribute filters (comma-separated)
 *   ?price=100-500                      incl-BTW price range in whole euros
 *   ?stock=1                            in-stock only
 *   ?sort=price_asc&page=2
 */
export function parseCatalogParams(params: SearchParams): CatalogFilters {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const attrs: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (RESERVED.has(key)) continue;
    const raw = first(value);
    if (!raw) continue;
    const values = raw.split(",").filter(Boolean);
    if (values.length) attrs[key] = values;
  }

  let priceMinCents: number | undefined;
  let priceMaxCents: number | undefined;
  const price = first(params.price);
  if (price) {
    const [min, max] = price.split("-");
    if (min && /^\d+$/.test(min)) priceMinCents = Number(min) * 100;
    if (max && /^\d+$/.test(max)) priceMaxCents = Number(max) * 100;
  }

  const sortRaw = first(params.sort);
  const pageRaw = first(params.page);

  return {
    attrs: Object.keys(attrs).length ? attrs : undefined,
    priceMinCents,
    priceMaxCents,
    inStockOnly: first(params.stock) === "1",
    search: first(params.q)?.trim() || undefined,
    sort: SORTS.includes(sortRaw as SortOption) ? (sortRaw as SortOption) : undefined,
    page: pageRaw && /^\d+$/.test(pageRaw) ? Number(pageRaw) : 1,
  };
}

/** Number of active filters (drives noindex + the "clear all" button). */
export function activeFilterCount(filters: CatalogFilters): number {
  return (
    Object.keys(filters.attrs ?? {}).length +
    (filters.priceMinCents != null || filters.priceMaxCents != null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0)
  );
}
