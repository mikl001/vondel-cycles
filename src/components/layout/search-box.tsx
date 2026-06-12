"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatCents, productImageUrl } from "@/lib/format";

interface Suggestion {
  product_id: string;
  suggestion: string;
  slug: string;
  price_incl_cents: number;
  image_path: string | null;
}

export function SearchBox() {
  const t = useTranslations("search");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    const timeout = setTimeout(async () => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(q)}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          setSuggestions(await res.json());
          setOpen(true);
        }
      } catch {
        // aborted or offline — keep previous suggestions
      }
    }, 150);
    return () => clearTimeout(timeout);
  }, [query, locale]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function submit() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push({ pathname: "/zoeken", query: { q } });
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="w-full rounded-full border border-vondel-200 bg-white px-4 py-2 pr-10 text-sm outline-none transition-colors focus:border-vondel-500"
        />
        <button
          type="submit"
          aria-label={t("title")}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-vondel-500 hover:text-vondel-700"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" />
          </svg>
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          aria-label={t("suggestionsLabel")}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-vondel-100 bg-white shadow-lg"
        >
          {suggestions.map((s) => (
            <li key={s.product_id}>
              <Link
                href={{ pathname: "/product/[slug]", params: { slug: s.slug } }}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-vondel-50"
              >
                {s.image_path && (
                  <span className="relative h-9 w-12 shrink-0 overflow-hidden rounded">
                    <Image src={productImageUrl(s.image_path)} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                )}
                <span className="flex-1 truncate text-vondel-900">{s.suggestion}</span>
                <span className="text-vondel-500">{formatCents(s.price_incl_cents, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
