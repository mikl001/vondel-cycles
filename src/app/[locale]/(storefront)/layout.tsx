import { setRequestLocale } from "next-intl/server";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCategoryTree } from "@/lib/catalog/queries";

export default async function StorefrontLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const categories = await getCategoryTree();

  return (
    <>
      <SiteHeader categories={categories} />
      <main id="content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
