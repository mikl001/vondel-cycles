import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CheckoutForm, type ShippingMethodView } from "@/components/checkout/checkout-form";
import { createStaticClient } from "@/lib/supabase/static";
import type { LocalizedText } from "@/types/catalog";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

async function getShippingMethods(): Promise<ShippingMethodView[]> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("shipping_methods")
      .select("code, name, description, price_cents, free_above_cents, supports_pickup")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return data.map((m) => ({
      code: m.code,
      name: m.name as LocalizedText,
      description: m.description as LocalizedText | null,
      priceCents: m.price_cents,
      freeAboveCents: m.free_above_cents,
      supportsPickup: m.supports_pickup,
    }));
  } catch {
    return [];
  }
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const methods = await getShippingMethods();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-vondel-900">
        {t("title")}
      </h1>
      <CheckoutForm methods={methods} />
    </div>
  );
}
