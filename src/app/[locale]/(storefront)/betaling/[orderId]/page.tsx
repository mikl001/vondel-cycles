import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { MockPayment } from "@/components/checkout/mock-payment";
import { getOrderForConfirmation } from "@/lib/orders/server";

interface Props {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function MockPaymentPage({ params, searchParams }: Props) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  if (!token) notFound();

  const order = await getOrderForConfirmation(orderId, token).catch(() => null);
  if (!order || order.status !== "pending") notFound();

  return (
    <MockPayment
      orderId={order.id}
      token={token}
      orderNumber={order.orderNumber}
      amountCents={order.totalInclCents}
    />
  );
}
