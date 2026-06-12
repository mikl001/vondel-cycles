import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";

function FooterLink({ pathname, label }: { pathname: AppPathname; label: string }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={pathname as any}
      className="transition-colors hover:text-white hover:underline"
    >
      {label}
    </Link>
  );
}

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
            <li>
              <FooterLink pathname="/contact" label={t("contact")} />
            </li>
            <li>
              <FooterLink pathname="/verzending-en-retour" label={t("shipping")} />
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-vondel-300">
            Vondel Cycles
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <FooterLink pathname="/over-ons" label={t("aboutUs")} />
            </li>
            <li>
              <FooterLink pathname="/privacy" label={t("privacy")} />
            </li>
            <li>
              <FooterLink pathname="/algemene-voorwaarden" label={t("terms")} />
            </li>
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
