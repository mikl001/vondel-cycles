import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CartPageContent } from "@/components/cart/cart-page-content";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CartPageContent />;
}
