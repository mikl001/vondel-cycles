import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Link } from "@/i18n/navigation";

function BikeLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="h-8 w-8 fill-none stroke-current"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="8" cy="22" r="5.5" />
      <circle cx="24" cy="22" r="5.5" />
      <path d="M8 22 13 11h7M24 22l-4-11h-3.5M13 11 8 22m5-11 6.5 11H8" />
      <path d="M18.5 8h3" />
    </svg>
  );
}

export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-vondel-100 bg-cream/95 backdrop-blur">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-vondel-800 focus:px-3 focus:py-2 focus:text-white"
      >
        {t("common.skipToContent")}
      </a>

      <div className="bg-vondel-900 px-4 py-1.5 text-center text-xs text-vondel-100">
        {t("common.demoDisclaimer")}
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-vondel-800 transition-colors hover:text-vondel-600"
        >
          <BikeLogo />
          <span className="flex flex-col leading-tight">
            <span className="font-semibold tracking-tight">
              {t("common.brand")}
            </span>
            <span className="hidden text-xs text-vondel-500 sm:block">
              {t("common.tagline")}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
