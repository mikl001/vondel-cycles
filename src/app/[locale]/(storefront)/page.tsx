import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductCard, toProductCardData } from "@/components/catalog/product-card";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategoryTree, getProductsByTag } from "@/lib/catalog/queries";
import { lt } from "@/lib/format";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import type { LocalizedText } from "@/types/catalog";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  return {
    alternates: {
      canonical: absoluteUrl(locale as Locale, { pathname: "/" }),
      languages: languageAlternates(() => ({ pathname: "/" })),
    },
  };
}

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  const t = await getTranslations("home");
  const tc = await getTranslations("catalog");
  const [categories, featured] = await Promise.all([
    getCategoryTree(),
    getProductsByTag("bestseller", 8),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-vondel-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col items-start justify-center gap-5">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-md text-lg text-vondel-200">{t("heroSubtitle")}</p>
            <Link
              href={{ pathname: "/categorie/[...slug]", params: { slug: [locale === "nl" ? "stadsfietsen" : "city-bikes"] } }}
              className="rounded-xl bg-accent-500 px-6 py-3 font-semibold text-vondel-950 transition-colors hover:bg-accent-400"
            >
              {t("heroCta")}
            </Link>
          </div>
          <div className="hidden items-center justify-center lg:flex" aria-hidden>
            <svg viewBox="0 0 32 32" className="h-64 w-64 fill-none stroke-vondel-700" strokeWidth="1">
              <circle cx="8" cy="22" r="5.5" />
              <circle cx="24" cy="22" r="5.5" />
              <path d="M8 22 13 11h7M24 22l-4-11h-3.5M13 11 8 22m5-11 6.5 11H8" />
              <path d="M18.5 8h3" />
            </svg>
          </div>
        </div>
        <div className="border-t border-vondel-800">
          <ul className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-vondel-200 sm:flex-row sm:justify-between sm:px-6">
            <li>✓ {t("usp1")}</li>
            <li>✓ {t("usp2")}</li>
            <li>✓ {t("usp3")}</li>
          </ul>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-vondel-900">
            {t("categoriesTitle")}
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={{
                    pathname: "/categorie/[...slug]",
                    params: { slug: [lt(category.slug, locale)] },
                  }}
                  className="group flex h-full flex-col justify-between gap-3 rounded-xl border border-vondel-100 bg-white p-5 transition-shadow hover:shadow-md"
                >
                  <span className="text-lg font-semibold text-vondel-900 group-hover:text-vondel-600">
                    {lt(category.name, locale)}
                  </span>
                  <span className="line-clamp-2 text-sm text-vondel-500">
                    {lt(category.description as LocalizedText, locale)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-vondel-900">
            {t("featuredTitle")}
          </h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <li key={p.id}>
                <ProductCard product={toProductCardData(p)} />
              </li>
            ))}
          </ul>
          <p className="sr-only">{tc("products", { count: featured.length })}</p>
        </section>
      )}
    </>
  );
}
