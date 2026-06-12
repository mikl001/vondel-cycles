import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

export default function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("home");

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
      <span className="rounded-full bg-accent-400/20 px-4 py-1.5 text-sm font-medium text-vondel-800">
        {t("comingSoon")}
      </span>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-vondel-900 sm:text-5xl">
        {t("heroTitle")}
      </h1>
      <p className="max-w-xl text-lg text-vondel-700">{t("heroSubtitle")}</p>
      <p className="text-sm text-vondel-500">{t("comingSoonText")}</p>
    </section>
  );
}
