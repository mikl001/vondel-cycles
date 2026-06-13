import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/** Localized 404 boundary — catches notFound() from product/category/order
 *  pages, rendered inside the [locale] layout (so it keeps <html lang> and the
 *  NextIntlClientProvider). */
export default async function LocaleNotFound() {
  // not-found.tsx receives no params; read the active locale from the request
  await getLocale();
  const t = await getTranslations("errors");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
      <span aria-hidden className="text-6xl font-bold text-vondel-200">
        404
      </span>
      <h1 className="text-2xl font-bold tracking-tight text-vondel-900">
        {t("notFoundTitle")}
      </h1>
      <p className="text-vondel-600">{t("notFoundText")}</p>
      <Link
        href="/"
        className="rounded-xl bg-vondel-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-vondel-600"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
