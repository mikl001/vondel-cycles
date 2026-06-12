import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Breadcrumbs, type Crumb } from "@/components/catalog/breadcrumbs";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductView } from "@/components/catalog/product-view";
import { StarRating } from "@/components/catalog/star-rating";
import { routing, type Locale } from "@/i18n/routing";
import {
  getAllProductSlugs,
  getCategoryTree,
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/catalog/queries";
import { lt } from "@/lib/format";
import type { CategoryNode, LocalizedText } from "@/types/catalog";

export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug: slug[locale] })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: lt(product.name, locale as Locale),
    description: lt(product.description, locale as Locale)?.slice(0, 160),
  };
}

function findTrailToCategory(
  tree: CategoryNode[],
  categoryId: string,
  trail: CategoryNode[] = [],
): CategoryNode[] | null {
  for (const node of tree) {
    const next = [...trail, node];
    if (node.id === categoryId) return next;
    const deeper = findTrailToCategory(node.children, categoryId, next);
    if (deeper) return deeper;
  }
  return null;
}

export default async function ProductPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("catalog");
  const [tree, { reviews, summary }, related] = await Promise.all([
    getCategoryTree(),
    getProductReviews(product.id),
    getRelatedProducts(product.id),
  ]);

  const trail = findTrailToCategory(tree, product.categoryId) ?? [];
  const crumbs: Crumb[] = [
    ...trail.map((node, i) => ({
      label: lt(node.name, locale),
      href: {
        pathname: "/categorie/[...slug]" as const,
        params: { slug: trail.slice(0, i + 1).map((n) => lt(n.slug, locale)) },
      },
    })),
    { label: lt(product.name, locale) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs crumbs={crumbs} />

      <div className="mt-6">
        <ProductView product={product} />
      </div>

      {/* Rating summary under the fold */}
      {summary.count > 0 && (
        <p className="mt-6 flex items-center gap-2 text-sm text-vondel-600">
          <StarRating rating={summary.average} />
          {summary.average.toFixed(1)} · {t("reviewCount", { count: summary.count })}
        </p>
      )}

      {/* Description + specs */}
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="description-heading">
          <h2 id="description-heading" className="mb-3 text-xl font-semibold text-vondel-900">
            {t("description")}
          </h2>
          <p className="leading-relaxed text-vondel-700">
            {lt(product.description, locale)}
          </p>
        </section>

        {product.specs.length > 0 && (
          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="mb-3 text-xl font-semibold text-vondel-900">
              {t("specifications")}
            </h2>
            <dl className="divide-y divide-vondel-100 rounded-xl border border-vondel-100 bg-white">
              {product.specs.map((spec, i) => (
                <div key={i} className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-vondel-500">{lt(spec.label, locale)}</dt>
                  <dd className="text-vondel-900">{lt(spec.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* Reviews */}
      <section aria-labelledby="reviews-heading" className="mt-12">
        <h2 id="reviews-heading" className="mb-4 text-xl font-semibold text-vondel-900">
          {t("reviews")}{" "}
          <span className="text-base font-normal text-vondel-400">
            {t("reviewCount", { count: summary.count })}
          </span>
        </h2>
        {reviews.length > 0 && (
          <ul className="grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-vondel-100 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <StarRating rating={review.rating} />
                  {review.isDemo && (
                    <span className="rounded bg-vondel-50 px-1.5 py-0.5 text-xs text-vondel-400">
                      {t("demoReview")}
                    </span>
                  )}
                </div>
                {review.title && (
                  <h3 className="mt-2 font-medium text-vondel-900">{review.title}</h3>
                )}
                {review.body && (
                  <p className="mt-1 text-sm leading-relaxed text-vondel-600">
                    {review.body}
                  </p>
                )}
                <p className="mt-2 text-xs text-vondel-400">
                  {review.authorName} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString(
                    locale === "nl" ? "nl-NL" : "en-GB",
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Related / cross-sell */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-12">
          <h2 id="related-heading" className="mb-4 text-xl font-semibold text-vondel-900">
            {t("related")}
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.slice(0, 4).map((p) => (
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
        </section>
      )}
    </div>
  );
}
