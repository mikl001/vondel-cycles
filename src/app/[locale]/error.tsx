"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

/** Localized error boundary with a reset affordance. Rendered inside the
 *  [locale] layout, so useTranslations resolves via the client provider. */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-vondel-900">
        {t("errorTitle")}
      </h1>
      <p className="text-vondel-600">{t("errorText")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-vondel-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-vondel-600"
      >
        {t("retry")}
      </button>
    </div>
  );
}
