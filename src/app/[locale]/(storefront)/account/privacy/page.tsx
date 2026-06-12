import { getTranslations, setRequestLocale } from "next-intl/server";

import { DeleteAccount } from "@/components/account/delete-account";

export default async function PrivacyPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.privacy");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-vondel-900">{t("title")}</h2>

      <section className="rounded-xl border border-vondel-100 bg-white p-5">
        <h3 className="mb-1 font-semibold text-vondel-900">{t("exportTitle")}</h3>
        <p className="mb-4 text-sm text-vondel-600">{t("exportText")}</p>
        <a
          href="/api/account/export"
          download
          className="inline-block rounded-xl border border-vondel-300 px-5 py-2.5 text-sm font-medium text-vondel-700 hover:border-vondel-500"
        >
          ⬇ {t("exportButton")}
        </a>
      </section>

      <DeleteAccount />
    </div>
  );
}
