"use client";

import { useLocale, useTranslations } from "next-intl";
// query-only URL updates: native hooks keep the locale-prefixed path intact
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { Locale } from "@/i18n/routing";
import { lt } from "@/lib/format";
import type { LocalizedText } from "@/types/catalog";

export interface FacetGroup {
  slug: string;
  name: LocalizedText;
  values: { slug: string; label: LocalizedText; count: number }[];
}

interface Props {
  facets: FacetGroup[];
  priceRange: { min: number; max: number } | null;
  activeCount: number;
}

export function FacetSidebar({ facets, priceRange, activeCount }: Props) {
  const t = useTranslations("filters");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const price = searchParams.get("price") ?? "";
  const [minInput, setMinInput] = useState(price.split("-")[0] ?? "");
  const [maxInput, setMaxInput] = useState(price.split("-")[1] ?? "");

  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page"); // filters reset pagination
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function toggleValue(attr: string, value: string) {
    update((params) => {
      const current = params.get(attr)?.split(",").filter(Boolean) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length) params.set(attr, next.join(","));
      else params.delete(attr);
    });
  }

  function applyPrice() {
    update((params) => {
      if (minInput || maxInput) params.set("price", `${minInput}-${maxInput}`);
      else params.delete("price");
    });
  }

  return (
    <aside aria-label={t("title")} className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-vondel-900">{t("title")}</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setMinInput("");
              setMaxInput("");
              update((params) => {
                const keep = params.get("sort");
                const q = params.get("q");
                [...params.keys()].forEach((k) => params.delete(k));
                if (keep) params.set("sort", keep);
                if (q) params.set("q", q);
              });
            }}
            className="text-sm text-vondel-500 underline hover:text-vondel-700"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      {/* In stock */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-vondel-800">
        <input
          type="checkbox"
          checked={searchParams.get("stock") === "1"}
          onChange={(e) =>
            update((params) => {
              if (e.target.checked) params.set("stock", "1");
              else params.delete("stock");
            })
          }
          className="h-4 w-4 accent-vondel-600"
        />
        {t("onlyInStock")}
      </label>

      {/* Price */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-vondel-700">{t("price")}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={priceRange ? String(Math.floor(priceRange.min / 100)) : t("priceMin")}
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            aria-label={t("priceMin")}
            className="w-20 rounded-lg border border-vondel-200 px-2 py-1.5 text-sm"
          />
          <span className="text-vondel-400">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={priceRange ? String(Math.ceil(priceRange.max / 100)) : t("priceMax")}
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            aria-label={t("priceMax")}
            className="w-20 rounded-lg border border-vondel-200 px-2 py-1.5 text-sm"
          />
          <span className="text-sm text-vondel-400">€</span>
        </div>
      </div>

      {/* Attribute facets */}
      {facets.map((facet) => {
        const selected = searchParams.get(facet.slug)?.split(",") ?? [];
        return (
          <div key={facet.slug}>
            <h3 className="mb-2 text-sm font-medium text-vondel-700">
              {lt(facet.name, locale)}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {facet.values.map((value) => (
                <li key={value.slug}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-vondel-800">
                    <input
                      type="checkbox"
                      checked={selected.includes(value.slug)}
                      onChange={() => toggleValue(facet.slug, value.slug)}
                      className="h-4 w-4 accent-vondel-600"
                    />
                    <span className="flex-1">{lt(value.label, locale)}</span>
                    <span className="text-xs text-vondel-400">{value.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}
