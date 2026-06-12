"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

const OPTIONS = ["newest", "price_asc", "price_desc", "name"] as const;

export function SortSelect({ withRelevance = false }: { withRelevance?: boolean }) {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const options = withRelevance ? (["relevance", ...OPTIONS] as const) : OPTIONS;
  const current = searchParams.get("sort") ?? options[0];

  return (
    <label className="flex items-center gap-2 text-sm text-vondel-700">
      {t("sortLabel")}
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", e.target.value);
          params.delete("page");
          startTransition(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
          });
        }}
        className="rounded-lg border border-vondel-200 bg-white px-2.5 py-1.5"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {t(`sort.${opt}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
