import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatCents, lt, productImageUrl } from "@/lib/format";
import type { LocalizedText } from "@/types/catalog";

export interface ProductCardData {
  id: string;
  slug: LocalizedText;
  name: LocalizedText;
  brand: string;
  vatRate: number;
  priceInclCents: number;
  imagePath: string | null;
  inStock: boolean;
  tagSlugs: string[];
}

const TAG_LABELS: Record<string, LocalizedText> = {
  bestseller: { nl: "Bestseller", en: "Bestseller" },
  nieuw: { nl: "Nieuw", en: "New" },
  sale: { nl: "Aanbieding", en: "Sale" },
  "amsterdam-proof": { nl: "Amsterdam-proof", en: "Amsterdam-proof" },
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalog");
  const tag = product.tagSlugs.find((s) => TAG_LABELS[s]);

  return (
    <Link
      href={{ pathname: "/product/[slug]", params: { slug: lt(product.slug, locale) } }}
      className="group flex flex-col overflow-hidden rounded-xl border border-vondel-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-vondel-50">
        {product.imagePath ? (
          <Image
            src={productImageUrl(product.imagePath)}
            alt={lt(product.name, locale)}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-vondel-300">
            Vondel Cycles
          </div>
        )}
        {tag && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-semibold text-white">
            {lt(TAG_LABELS[tag], locale)}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-vondel-900/80 px-2.5 py-1 text-xs font-medium text-white">
            {t("outOfStock")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs uppercase tracking-wide text-vondel-400">
          {product.brand}
        </span>
        <h3 className="font-medium leading-snug text-vondel-900 group-hover:text-vondel-600">
          {lt(product.name, locale)}
        </h3>
        <p className="mt-auto pt-2">
          <span className="text-lg font-semibold text-vondel-900">
            {formatCents(product.priceInclCents, locale)}
          </span>
          <span className="ml-1.5 text-xs text-vondel-400">
            {t("inclBtw", { rate: product.vatRate })}
          </span>
        </p>
      </div>
    </Link>
  );
}
