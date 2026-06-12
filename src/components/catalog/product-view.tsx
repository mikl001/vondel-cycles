"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { Locale } from "@/i18n/routing";
import { formatCents, inclBtwCents, lt, productImageUrl } from "@/lib/format";
import type { ProductDetail, ProductVariant } from "@/types/catalog";

/** Option groups in display order with de-duplicated values */
function buildOptionGroups(variants: ProductVariant[]) {
  const groups = new Map<string, { value: string; label: ProductVariant["options"][string]["label"] }[]>();
  for (const v of variants) {
    for (const [key, opt] of Object.entries(v.options)) {
      const list = groups.get(key) ?? [];
      if (!list.some((o) => o.value === opt.value)) list.push(opt);
      groups.set(key, list);
    }
  }
  return groups;
}

export function ProductView({ product }: { product: ProductDetail }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("catalog");

  const groups = useMemo(() => buildOptionGroups(product.variants), [product.variants]);
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    // default: first variant that has stock, else first variant
    const preferred =
      product.variants.find((v) => v.stockQuantity > 0) ?? product.variants[0];
    return Object.fromEntries(
      Object.entries(preferred?.options ?? {}).map(([k, o]) => [k, o.value]),
    );
  });

  const selectedVariant = useMemo(
    () =>
      product.variants.find((v) =>
        Object.entries(selection).every(([k, val]) => v.options[k]?.value === val),
      ) ?? null,
    [product.variants, selection],
  );

  const priceExcl = selectedVariant?.priceCents ?? product.basePriceCents;
  const priceIncl = inclBtwCents(priceExcl, product.vatRate);

  // Show the image matching the selected colour when there is one
  const [imageIndex, setImageIndex] = useState(0);
  const activeImageIndex = useMemo(() => {
    const color = selection.kleur;
    if (color) {
      const idx = product.images.findIndex((img) =>
        img.storagePath.includes(`/${color}.`),
      );
      if (idx >= 0) return idx;
    }
    return imageIndex;
  }, [selection.kleur, product.images, imageIndex]);

  const activeImage = product.images[activeImageIndex] ?? product.images[0];

  function isOptionAvailable(groupKey: string, value: string): boolean {
    return product.variants.some(
      (v) =>
        v.options[groupKey]?.value === value &&
        v.stockQuantity > 0 &&
        Object.entries(selection).every(
          ([k, val]) => k === groupKey || v.options[k]?.value === val,
        ),
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-vondel-100 bg-vondel-50">
          {activeImage && (
            <Image
              src={productImageUrl(activeImage.storagePath)}
              alt={lt(activeImage.alt, locale) || lt(product.name, locale)}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        {product.images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={img.storagePath}
                type="button"
                onClick={() => {
                  setImageIndex(i);
                  // selecting a thumb of another colour also switches the colour
                  const m = img.storagePath.match(/\/([^/]+)\.\w+$/);
                  const color = m?.[1];
                  if (color && groups.get("kleur")?.some((o) => o.value === color)) {
                    setSelection((s) => ({ ...s, kleur: color }));
                  }
                }}
                aria-label={lt(img.alt, locale)}
                className={`relative h-16 w-20 overflow-hidden rounded-lg border-2 ${
                  i === activeImageIndex
                    ? "border-vondel-600"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={productImageUrl(img.storagePath)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Purchase panel */}
      <div className="flex flex-col gap-5">
        <div>
          <span className="text-sm uppercase tracking-wide text-vondel-400">
            {product.brand}
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-vondel-900">
            {lt(product.name, locale)}
          </h1>
        </div>

        <p>
          <span className="text-3xl font-bold text-vondel-900">
            {formatCents(priceIncl, locale)}
          </span>
          <span className="ml-2 text-sm text-vondel-400">
            {t("inclBtw", { rate: product.vatRate })} ·{" "}
            {formatCents(priceExcl, locale)} {t("exclBtw")}
          </span>
        </p>

        {groups.size > 0 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="sr-only">{t("chooseOptions")}</legend>
            {[...groups.entries()].map(([key, options]) => (
              <div key={key}>
                <p className="mb-2 text-sm font-medium capitalize text-vondel-700">
                  {key === "kleur"
                    ? locale === "nl"
                      ? "Kleur"
                      : "Colour"
                    : locale === "nl"
                      ? "Maat"
                      : "Size"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => {
                    const active = selection[key] === opt.value;
                    const available = isOptionAvailable(key, opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setSelection((s) => ({ ...s, [key]: opt.value }))
                        }
                        aria-pressed={active}
                        className={`rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                          active
                            ? "border-vondel-700 bg-vondel-700 text-white"
                            : available
                              ? "border-vondel-200 bg-white text-vondel-800 hover:border-vondel-400"
                              : "border-dashed border-vondel-200 text-vondel-300"
                        }`}
                      >
                        {lt(opt.label, locale)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </fieldset>
        )}

        {/* Stock + add to cart */}
        <div className="flex flex-col gap-3">
          {selectedVariant ? (
            selectedVariant.stockQuantity === 0 ? (
              <p className="text-sm font-medium text-red-700">{t("outOfStock")}</p>
            ) : selectedVariant.stockQuantity <= selectedVariant.lowStockThreshold ? (
              <p className="text-sm font-medium text-accent-600">
                {t("lowStock", { count: selectedVariant.stockQuantity })}
              </p>
            ) : (
              <p className="text-sm font-medium text-vondel-600">
                ✓ {t("inStock")}
              </p>
            )
          ) : null}

          <button
            type="button"
            disabled={!selectedVariant || selectedVariant.stockQuantity === 0}
            className="rounded-xl bg-vondel-700 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-vondel-600 disabled:cursor-not-allowed disabled:bg-vondel-200"
            // Cart lands in Phase 4 — the button is wired to the variant already
            data-variant-id={selectedVariant?.id}
          >
            {t("addToCart")}
          </button>

          {selectedVariant && (
            <p className="text-xs text-vondel-400">
              {t("sku")}: {selectedVariant.sku}
            </p>
          )}
        </div>

        <ul className="flex flex-col gap-1.5 rounded-xl bg-vondel-50 p-4 text-sm text-vondel-700">
          <li>✓ {t("freeShipping")}</li>
          <li>✓ {t("delivery")}</li>
          <li>✓ {t("warranty")}</li>
        </ul>
      </div>
    </div>
  );
}
