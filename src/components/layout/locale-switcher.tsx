"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { routing, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: Locale) {
    if (next === locale) return;
    router.replace(
      // @ts-expect-error -- pathname and params always match for the
      // current route, so the compile-time pairing check can be skipped.
      { pathname, params },
      { locale: next },
    );
  }

  return (
    <div
      className="flex overflow-hidden rounded-full border border-vondel-200 text-xs font-medium"
      role="group"
      aria-label={t("switchTo")}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={l === locale}
          className={
            l === locale
              ? "bg-vondel-700 px-3 py-1.5 text-white"
              : "px-3 py-1.5 text-vondel-700 transition-colors hover:bg-vondel-50"
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
