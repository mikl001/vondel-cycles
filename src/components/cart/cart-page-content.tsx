"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { useCart } from "@/components/cart/cart-provider";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatCents, lt, productImageUrl } from "@/lib/format";

export function CartPageContent() {
  const t = useTranslations("cart");
  const tc = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const { cart, pending, updateQuantity, removeItem } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-vondel-900">
        {t("title")}
      </h1>

      {cart.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-vondel-200 p-12 text-center">
          <p className="text-vondel-500">{pending ? "…" : t("empty")}</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-vondel-700 px-6 py-2.5 font-medium text-white hover:bg-vondel-600"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-vondel-100 rounded-xl border border-vondel-100 bg-white px-5">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                {item.imagePath && (
                  <Link
                    href={{ pathname: "/product/[slug]", params: { slug: lt(item.productSlug, locale) } }}
                    className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-vondel-50"
                  >
                    <Image src={productImageUrl(item.imagePath)} alt="" fill sizes="128px" className="object-cover" />
                  </Link>
                )}
                <div className="flex flex-1 flex-col">
                  <span className="text-xs uppercase tracking-wide text-vondel-400">
                    {item.brand}
                  </span>
                  <Link
                    href={{ pathname: "/product/[slug]", params: { slug: lt(item.productSlug, locale) } }}
                    className="font-medium text-vondel-900 hover:text-vondel-600"
                  >
                    {lt(item.productName, locale)}
                  </Link>
                  <span className="mt-0.5 text-sm text-vondel-500">
                    {Object.values(item.options)
                      .map((o) => lt(o.label, locale))
                      .join(" · ")}
                  </span>
                  <span className="text-xs text-vondel-400">{item.sku}</span>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-lg border border-vondel-200">
                      <button
                        type="button"
                        aria-label={t("decrease")}
                        disabled={item.quantity <= 1}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1.5 text-vondel-600 disabled:text-vondel-200"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={t("increase")}
                        disabled={item.quantity >= Math.min(item.stockQuantity, 99)}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1.5 text-vondel-600 disabled:text-vondel-200"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-vondel-900">
                        {formatCents(item.lineInclCents, locale)}
                      </span>
                      <span className="block text-xs text-vondel-400">
                        {formatCents(item.unitPriceInclCents, locale)} / {tc("inclBtw", { rate: item.vatRate })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t("remove")}
                  onClick={() => removeItem(item.id)}
                  className="self-start p-1.5 text-vondel-300 hover:text-red-600"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M3 5h14M8 5V3.5A1.5 1.5 0 0 1 9.5 2h1A1.5 1.5 0 0 1 12 3.5V5m3 0-.7 11.2a1.8 1.8 0 0 1-1.8 1.8H7.5a1.8 1.8 0 0 1-1.8-1.8L5 5" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl border border-vondel-100 bg-white p-5">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-vondel-600">
                <dt>{t("subtotalExcl")}</dt>
                <dd>{formatCents(cart.totals.subtotalExclCents, locale)}</dd>
              </div>
              {Object.entries(cart.totals.vatBreakdown).map(([rate, cents]) => (
                <div key={rate} className="flex justify-between text-vondel-500">
                  <dt>{rate}% btw</dt>
                  <dd>{formatCents(cents, locale)}</dd>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-vondel-100 pt-3 text-base font-semibold text-vondel-900">
                <dt>{t("total")}</dt>
                <dd>{formatCents(cart.totals.totalInclCents, locale)}</dd>
              </div>
            </dl>
            <Link
              href="/afrekenen"
              className="mt-4 block w-full rounded-xl bg-vondel-700 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-vondel-600"
            >
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
