import type { MetadataRoute } from "next";

import { routing, type Locale } from "@/i18n/routing";
import { getAllProductSlugs, getCategoryTree } from "@/lib/catalog/queries";
import { lt } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import type { CategoryNode } from "@/types/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, productSlugs] = await Promise.all([
    getCategoryTree(),
    getAllProductSlugs(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  const withAlternates = (
    hrefFor: (locale: Locale) => Parameters<typeof absoluteUrl>[1],
    priority: number,
  ) => {
    entries.push({
      url: absoluteUrl(routing.defaultLocale, hrefFor(routing.defaultLocale)),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((locale) => [locale, absoluteUrl(locale, hrefFor(locale))]),
        ),
      },
      changeFrequency: "weekly",
      priority,
    });
  };

  withAlternates(() => ({ pathname: "/" }), 1);

  for (const pathname of [
    "/over-ons",
    "/contact",
    "/verzending-en-retour",
    "/privacy",
    "/algemene-voorwaarden",
  ] as const) {
    withAlternates(() => ({ pathname }), 0.4);
  }

  const walk = (nodes: CategoryNode[], trail: CategoryNode[]) => {
    for (const node of nodes) {
      const path = [...trail, node];
      withAlternates(
        (locale) => ({
          pathname: "/categorie/[...slug]",
          params: { slug: path.map((n) => lt(n.slug, locale)) },
        }),
        0.8,
      );
      walk(node.children, path);
    }
  };
  walk(tree, []);

  for (const slug of productSlugs) {
    withAlternates(
      (locale) => ({
        pathname: "/product/[slug]",
        params: { slug: slug[locale] },
      }),
      0.7,
    );
  }

  return entries;
}
