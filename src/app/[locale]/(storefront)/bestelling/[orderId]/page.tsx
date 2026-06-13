import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";

import { CartRefreshOnMount } from "@/components/cart/cart-refresh-on-mount";
import { ConfirmationPoller } from "@/components/checkout/confirmation-status";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatCents, lt, productImageUrl } from "@/lib/format";
import { getOrderForConfirmation } from "@/lib/orders/server";
import type { LocalizedText } from "@/types/catalog";

interface Props {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "confirmation" });
  return { title: t("paidTitle"), robots: { index: false, follow: false } };
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale: rawLocale, orderId } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;
  const { token } = await searchParams;
  if (!token) notFound();

  const t = await getTranslations("confirmation");
  const tStatus = await getTranslations("account.orders.statuses");
  const order = await getOrderForConfirmation(orderId, token).catch(() => null);
  if (!order) notFound();

  const failed = ["cancelled", "failed", "expired"].includes(order.status);
  const pendingPayment = order.status === "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {pendingPayment && <ConfirmationPoller orderId={order.id} token={token} />}
      {/* cart converted on payment — resync the header badge */}
      {!pendingPayment && <CartRefreshOnMount />}

      <div className="mb-8 text-center">
        {pendingPayment ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-vondel-900">
              {t("pendingTitle")}
            </h1>
            <p className="mt-2 text-vondel-600">{t("pendingText")}</p>
          </>
        ) : failed ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-red-700">
              {t("failedTitle")}
            </h1>
            <p className="mt-2 text-vondel-600">{t("failedText")}</p>
          </>
        ) : (
          <>
            <span aria-hidden className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-vondel-100 text-3xl text-vondel-700">
              ✓
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-vondel-900">
              {t("paidTitle")}
            </h1>
            <p className="mt-2 text-vondel-600">
              {t("paidText", { email: order.email })}
            </p>
          </>
        )}
        <p className="mt-3 text-sm text-vondel-400">
          {t("title", { orderNumber: order.orderNumber })} · {t("status")}:{" "}
          {tStatus(order.status)}
        </p>
      </div>

      <section className="rounded-xl border border-vondel-100 bg-white">
        <h2 className="flex items-baseline justify-between border-b border-vondel-100 px-5 py-3 font-semibold text-vondel-900">
          {t("items")}
          <span className="text-xs font-normal text-vondel-400">
            {t("pricesExcl")}
          </span>
        </h2>
        <ul className="divide-y divide-vondel-100 px-5">
          {order.items.map((item) => (
            <li key={item.sku} className="flex items-center gap-3 py-3">
              {item.imagePath && (
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-vondel-50">
                  <Image src={productImageUrl(item.imagePath)} alt="" fill sizes="64px" className="object-cover" />
                </span>
              )}
              <span className="flex-1 text-sm text-vondel-900">
                {item.quantity}× {lt(item.productName as LocalizedText, locale)}
                <span className="block text-xs text-vondel-400">{item.sku}</span>
              </span>
              {/* excl-VAT line totals so the items foot to the excl subtotal +
                  VAT = total (and to the excl total under reverse charge) */}
              <span className="text-sm font-medium text-vondel-900">
                {formatCents(item.unitPriceExclCents * item.quantity, locale)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-vondel-100 px-5 py-4 text-sm">
          <div className="flex justify-between text-vondel-600">
            <dt>{t("subtotal")}</dt>
            <dd>{formatCents(order.subtotalExclCents, locale)}</dd>
          </div>
          {order.promoDiscountCents > 0 && (
            <div className="flex justify-between text-vondel-600">
              <dt>{t("discount")}</dt>
              <dd>−{formatCents(order.promoDiscountCents, locale)}</dd>
            </div>
          )}
          {order.shippingCostCents > 0 && (
            <div className="flex justify-between text-vondel-600">
              <dt>{t("shipping")}</dt>
              <dd>{formatCents(order.shippingCostCents, locale)}</dd>
            </div>
          )}
          {Object.entries(order.vatBreakdown)
            // under reverse charge the per-rate VAT is 0 — show the note, not 0,00 rows
            .filter(([, cents]) => !order.reverseCharge && cents > 0)
            .map(([rate, cents]) => (
              <div key={rate} className="flex justify-between text-vondel-500">
                <dt>{t("vat", { rate })}</dt>
                <dd>{formatCents(cents, locale)}</dd>
              </div>
            ))}
          {order.reverseCharge && (
            <p className="text-xs text-vondel-500">{t("reverseChargeNote")}</p>
          )}
          <div className="mt-1 flex justify-between border-t border-vondel-100 pt-2 text-base font-semibold text-vondel-900">
            <dt>{t("total")}</dt>
            <dd>{formatCents(order.totalInclCents, locale)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-vondel-100 bg-white px-5 py-4 text-sm">
        <h2 className="mb-1 font-semibold text-vondel-900">
          {order.pickupPoint ? t("pickupAt") : t("deliveryTo")}
        </h2>
        {order.pickupPoint ? (
          <p className="text-vondel-600">
            {order.pickupPoint.name}, {order.pickupPoint.street}, {order.pickupPoint.city}
          </p>
        ) : (
          <p className="text-vondel-600">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName},{" "}
            {order.shippingAddress.street} {order.shippingAddress.houseNumber}
            {order.shippingAddress.addition ? ` ${order.shippingAddress.addition}` : ""},{" "}
            {order.shippingAddress.postcode} {order.shippingAddress.city}
          </p>
        )}
      </section>

      <p className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block rounded-xl bg-vondel-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-vondel-600"
        >
          {t("backToShop")}
        </Link>
      </p>
    </div>
  );
}
