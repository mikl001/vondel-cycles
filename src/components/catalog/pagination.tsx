"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";

export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const t = useTranslations("filters.pagination");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  };

  return (
    <nav aria-label={t("page", { page, total: pageCount })} className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={hrefFor(page - 1) as any}
          rel="prev"
          className="rounded-lg border border-vondel-200 px-4 py-2 text-sm hover:border-vondel-400"
        >
          ← {t("previous")}
        </Link>
      ) : (
        <span className="rounded-lg border border-vondel-100 px-4 py-2 text-sm text-vondel-300">
          ← {t("previous")}
        </span>
      )}
      <span className="text-sm text-vondel-600">{t("page", { page, total: pageCount })}</span>
      {page < pageCount ? (
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={hrefFor(page + 1) as any}
          rel="next"
          className="rounded-lg border border-vondel-200 px-4 py-2 text-sm hover:border-vondel-400"
        >
          {t("next")} →
        </Link>
      ) : (
        <span className="rounded-lg border border-vondel-100 px-4 py-2 text-sm text-vondel-300">
          {t("next")} →
        </span>
      )}
    </nav>
  );
}
