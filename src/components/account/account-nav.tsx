"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import type { AppPathname, Locale } from "@/i18n/routing";
import { signOut } from "@/lib/auth/actions";

const ITEMS: { key: string; pathname: AppPathname }[] = [
  { key: "overview", pathname: "/account" },
  { key: "orders", pathname: "/account/bestellingen" },
  { key: "addresses", pathname: "/account/adressen" },
  { key: "wishlist", pathname: "/account/verlanglijst" },
  { key: "privacy", pathname: "/account/privacy" },
];

export function AccountNav() {
  const t = useTranslations("account.nav");
  const ta = useTranslations("auth");
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <nav aria-label={t("overview")} className="flex flex-col gap-1">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={item.pathname as any}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === item.pathname
              ? "bg-vondel-700 text-white"
              : "text-vondel-700 hover:bg-vondel-50"
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
      <form action={signOut.bind(null, locale)} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-lg border border-vondel-200 px-3 py-2 text-left text-sm text-vondel-500 transition-colors hover:border-vondel-400 hover:text-vondel-700"
        >
          {ta("logout")}
        </button>
      </form>
    </nav>
  );
}
