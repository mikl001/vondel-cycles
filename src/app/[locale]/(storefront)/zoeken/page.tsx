import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FacetSidebar, type FacetGroup } from "@/components/catalog/facet-sidebar";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { activeFilterCount, parseCatalogParams, type SearchParams } from "@/lib/catalog/params";
import { getFacetCounts, listProducts } from "@/lib/catalog/queries";
import type { LocalizedText } from "@/types/catalog";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "search" });
  // Search result pages should never be indexed
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);

  const t = await getTranslations("search");
  const tf = await getTranslations("filters");
  const filters = parseCatalogParams(await searchParams);
  const query = filters.search ?? "";

  const [result, facetRows] = query
    ? await Promise.all([listProducts(filters), getFacetCounts(filters)])
    : [{ items: [], total: 0, page: 1, pageCount: 0 }, []];

  const facets: FacetGroup[] = [];
  for (const row of facetRows) {
    let group = facets.find((f) => f.slug === row.attribute_slug);
    if (!group) {
      group = {
        slug: row.attribute_slug,
        name: row.attribute_name as LocalizedText,
        values: [],
      };
      facets.push(group);
    }
    group.values.push({
      slug: row.value_slug,
      label: row.value_label as LocalizedText,
      count: row.product_count,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-vondel-900">
        {query ? t("resultsFor", { query }) : t("title")}
      </h1>

      {query && result.total === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-vondel-200 p-10 text-center text-vondel-500">
          {t("noResults", { query })}
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <FacetSidebar
            facets={facets}
            priceRange={null}
            activeCount={activeFilterCount(filters)}
          />
          <div>
            <div className="mb-4 flex justify-end">
              <SortSelect withRelevance />
            </div>
            {result.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-vondel-200 p-10 text-center text-vondel-500">
                {tf("noResults")}
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {result.items.map((p) => (
                  <li key={p.id}>
                    <ProductCard
                      product={{
                        id: p.id,
                        slug: p.slug as LocalizedText,
                        name: p.name as LocalizedText,
                        brand: p.brand,
                        vatRate: p.vat_rate,
                        priceInclCents: p.price_incl_cents,
                        imagePath: p.image_path,
                        inStock: p.in_stock,
                        tagSlugs: p.tag_slugs,
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
            <Pagination page={result.page} pageCount={result.pageCount} />
          </div>
        </div>
      )}
    </div>
  );
}
