import { getPathname } from "@/i18n/navigation";
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import { inclBtwCents, lt, productImageUrl } from "@/lib/format";
import type { ProductDetail, ReviewSummary } from "@/types/catalog";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

interface LocalizedHref {
  pathname: AppPathname;
  params?: Record<string, string | string[]>;
}

export function absoluteUrl(locale: Locale, href: LocalizedHref): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return siteUrl() + getPathname({ locale, href: href as any });
}

/** hreflang map for generateMetadata `alternates.languages` */
export function languageAlternates(
  hrefFor: (locale: Locale) => LocalizedHref,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(locale, hrefFor(locale));
  }
  languages["x-default"] = absoluteUrl(routing.defaultLocale, hrefFor(routing.defaultLocale));
  return languages;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vondel Cycles",
    url: siteUrl(),
    logo: `${siteUrl()}/favicon.ico`,
    description:
      "Fictieve demo-webshop voor portfolio-doeleinden / fictional demo webshop for portfolio purposes",
  };
}

export function productJsonLd(
  product: ProductDetail,
  summary: ReviewSummary,
  locale: Locale,
) {
  const inStock = product.variants.some((v) => v.stockQuantity > 0);
  const prices = product.variants.map((v) =>
    inclBtwCents(v.priceCents ?? product.basePriceCents, product.vatRate),
  );
  const lowest = prices.length ? Math.min(...prices) : inclBtwCents(product.basePriceCents, product.vatRate);
  const highest = prices.length ? Math.max(...prices) : lowest;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: lt(product.name, locale),
    description: lt(product.description, locale),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((i) => productImageUrl(i.storagePath)),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: (lowest / 100).toFixed(2),
      highPrice: (highest / 100).toFixed(2),
      offerCount: product.variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(locale, {
        pathname: "/product/[slug]",
        params: { slug: lt(product.slug, locale) },
      }),
    },
  };

  if (summary.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: summary.average.toFixed(1),
      reviewCount: summary.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return data;
}

export function breadcrumbJsonLd(
  items: { name: string; href?: LocalizedHref }[],
  locale: Locale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl(locale, { pathname: "/" }),
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        ...(item.href ? { item: absoluteUrl(locale, item.href) } : {}),
      })),
    ],
  };
}
