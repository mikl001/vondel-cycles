import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Breadcrumbs, type Crumb } from "@/components/catalog/breadcrumbs";
import { FacetSidebar, type FacetGroup } from "@/components/catalog/facet-sidebar";
import { Pagination } from "@/components/catalog/pagination";
import { ProductCard } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { activeFilterCount, parseCatalogParams, type SearchParams } from "@/lib/catalog/params";
import {
  categoryScopeIds,
  findCategoryBySlug,
  getCategoryTree,
  getFacetCounts,
  getPriceRange,
  listProducts,
} from "@/lib/catalog/queries";
import { lt } from "@/lib/format";
import type { LocalizedText } from "@/types/catalog";

interface Props {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tree = await getCategoryTree();
  const found = findCategoryBySlug(tree, slug);
  if (!found) return {};

  const filters = parseCatalogParams(await searchParams);
  const filterCount = activeFilterCount(filters);
  const name = lt(found.category.name, locale as Locale);

  return {
    title: name,
    description: lt(found.category.description as LocalizedText, locale as Locale),
    // Filtered/paginated views canonicalize to the clean category URL and
    // stay out of the index once more than one filter is active.
    robots: filterCount > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale: rawLocale, slug } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const tree = await getCategoryTree();
  const found = findCategoryBySlug(tree, slug);
  if (!found) notFound();

  const { category, trail } = found;
  const t = await getTranslations("catalog");
  const tf = await getTranslations("filters");

  const filters = {
    ...parseCatalogParams(await searchParams),
    categoryIds: categoryScopeIds(category),
  };

  const [result, facetRows, priceRange] = await Promise.all([
    listProducts(filters),
    getFacetCounts(filters),
    getPriceRange(filters.categoryIds),
  ]);

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

  const crumbs: Crumb[] = trail.map((node, i) => ({
    label: lt(node.name, locale),
    href: {
      pathname: "/categorie/[...slug]",
      params: { slug: trail.slice(0, i + 1).map((n) => lt(n.slug, locale)) },
    },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs crumbs={crumbs} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-vondel-900">
            {lt(category.name, locale)}
          </h1>
          <p className="mt-1 max-w-2xl text-vondel-600">
            {lt(category.description as LocalizedText, locale)}
          </p>
        </div>
        <p className="text-sm text-vondel-500">{t("products", { count: result.total })}</p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <li key={child.id}>
              <Link
                href={{
                  pathname: "/categorie/[...slug]",
                  params: {
                    slug: [...trail.map((n) => lt(n.slug, locale)), lt(child.slug, locale)],
                  },
                }}
                className="block rounded-full border border-vondel-200 bg-white px-4 py-1.5 text-sm text-vondel-800 transition-colors hover:border-vondel-400"
              >
                {lt(child.name, locale)}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <FacetSidebar
          facets={facets}
          priceRange={priceRange}
          activeCount={activeFilterCount(filters)}
        />

        <div>
          <div className="mb-4 flex justify-end">
            <SortSelect />
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
    </div>
  );
}
