import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-vondel-100 bg-vondel-950 text-vondel-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-vondel-300">
            {t("customerService")}
          </h2>
          <ul className="space-y-2 text-sm">
            <li>{t("contact")}</li>
            <li>{t("shipping")}</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-vondel-300">
            Vondel Cycles
          </h2>
          <ul className="space-y-2 text-sm">
            <li>{t("aboutUs")}</li>
            <li>{t("privacy")}</li>
            <li>{t("terms")}</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-vondel-300">
            {t("demoKeurmerk")}
          </h2>
          <div className="inline-flex items-center gap-2 rounded border border-vondel-700 px-3 py-2 text-sm">
            <span aria-hidden>✓</span>
            <span>
              VeiligWinkelen
              <span className="block text-xs text-vondel-400">
                {t("demoKeurmerkNote")}
              </span>
            </span>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-vondel-300">
            {t("paymentMethods")}
          </h2>
          <p className="text-sm text-vondel-300">iDEAL · Bancontact · Visa · Mastercard</p>
        </div>
      </div>
      <div className="border-t border-vondel-800 px-4 py-4 text-center text-xs text-vondel-400">
        {t("copyright", { year })}
      </div>
    </footer>
  );
}
