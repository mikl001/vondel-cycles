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
  // -1 = the typed query itself (no option highlighted)
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listId = "search-suggestions";

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
          setActiveIndex(-1);
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

  function goToQuery() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push({ pathname: "/zoeken", query: { q } });
  }

  function goToSuggestion(s: Suggestion) {
    setOpen(false);
    router.push({ pathname: "/product/[slug]", params: { slug: s.slug } });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      goToSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && suggestions.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToQuery();
        }}
      >
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={onKeyDown}
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

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("suggestionsLabel")}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-vondel-100 bg-white shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.product_id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
            >
              <Link
                href={{ pathname: "/product/[slug]", params: { slug: s.slug } }}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActiveIndex(i)}
                tabIndex={-1}
                className={`flex items-center gap-3 px-3 py-2 text-sm ${
                  i === activeIndex ? "bg-vondel-50" : ""
                }`}
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
