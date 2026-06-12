import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { InfoPageContent } from "@/components/layout/info-page";
import { routing, type Locale } from "@/i18n/routing";
import { INFO_PAGES } from "@/lib/content/info-pages";
import { absoluteUrl, languageAlternates } from "@/lib/seo";

interface Props {
  params: Promise<{ locale: string }>;
}

/** Shared factory for the static content pages (about/contact/shipping/…). */
export function createInfoPage(key: keyof typeof INFO_PAGES) {
  const page = INFO_PAGES[key];

  async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    return {
      title: page.title[locale as Locale],
      description: page.intro[locale as Locale],
      alternates: {
        canonical: absoluteUrl(locale as Locale, { pathname: page.pathname }),
        languages: languageAlternates(() => ({ pathname: page.pathname })),
      },
    };
  }

  function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
  }

  async function Page({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <InfoPageContent page={page} locale={locale as Locale} />;
  }

  return { generateMetadata, generateStaticParams, Page };
}
