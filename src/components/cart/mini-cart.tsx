"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatCents, lt, productImageUrl } from "@/lib/format";

export function CartButton() {
  const t = useTranslations("cart");
  const { cart, setDrawerOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={t("title")}
      className="relative rounded-full p-2 text-vondel-700 transition-colors hover:bg-vondel-50"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h2l2.2 11.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20.5 8H6.4" />
        <circle cx="10" cy="20.5" r="1.4" />
        <circle cx="17.5" cy="20.5" r="1.4" />
      </svg>
      {cart.itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
          {cart.itemCount}
        </span>
      )}
    </button>
  );
}

export function MiniCartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const { cart, drawerOpen, setDrawerOpen, updateQuantity, removeItem } = useCart();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    if (drawerOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("title")}>
      <button
        type="button"
        aria-label={t("close")}
        onClick={() => setDrawerOpen(false)}
        className="absolute inset-0 bg-vondel-950/40"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-vondel-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-vondel-900">
            {t("title")} ({cart.itemCount})
          </h2>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={t("close")}
            className="rounded-full p-1.5 text-vondel-500 hover:bg-vondel-50"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </header>

        {cart.items.length === 0 ? (
          <p className="flex flex-1 items-center justify-center p-8 text-vondel-500">
            {t("empty")}
          </p>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-vondel-100 overflow-y-auto px-5">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  {item.imagePath && (
                    <Link
                      href={{ pathname: "/product/[slug]", params: { slug: lt(item.productSlug, locale) } }}
                      onClick={() => setDrawerOpen(false)}
                      className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-vondel-50"
                    >
                      <Image src={productImageUrl(item.imagePath)} alt="" fill sizes="96px" className="object-cover" />
                    </Link>
                  )}
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={{ pathname: "/product/[slug]", params: { slug: lt(item.productSlug, locale) } }}
                      onClick={() => setDrawerOpen(false)}
                      className="text-sm font-medium text-vondel-900 hover:text-vondel-600"
                    >
                      {lt(item.productName, locale)}
                    </Link>
                    <span className="mt-0.5 text-xs text-vondel-400">
                      {Object.values(item.options)
                        .map((o) => lt(o.label, locale))
                        .join(" · ")}
                    </span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-vondel-200">
                        <button
                          type="button"
                          aria-label={t("decrease")}
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-vondel-600 disabled:text-vondel-200"
                        >
                          −
                        </button>
                        <span className="min-w-7 text-center text-sm">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={t("increase")}
                          disabled={item.quantity >= Math.min(item.stockQuantity, 99)}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-vondel-600 disabled:text-vondel-200"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-vondel-900">
                        {formatCents(item.lineInclCents, locale)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={t("remove")}
                    onClick={() => removeItem(item.id)}
                    className="self-start p-1 text-vondel-300 hover:text-red-600"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M3 5h14M8 5V3.5A1.5 1.5 0 0 1 9.5 2h1A1.5 1.5 0 0 1 12 3.5V5m3 0-.7 11.2a1.8 1.8 0 0 1-1.8 1.8H7.5a1.8 1.8 0 0 1-1.8-1.8L5 5" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <footer className="border-t border-vondel-100 px-5 py-4">
              <dl className="mb-3 flex flex-col gap-1 text-sm">
                {Object.entries(cart.totals.vatBreakdown).map(([rate, cents]) => (
                  <div key={rate} className="flex justify-between text-vondel-500">
                    <dt>{tc("inclBtw", { rate })}</dt>
                    <dd>{formatCents(cents, locale)}</dd>
                  </div>
                ))}
                <div className="flex justify-between text-base font-semibold text-vondel-900">
                  <dt>{t("total")}</dt>
                  <dd>{formatCents(cart.totals.totalInclCents, locale)}</dd>
                </div>
              </dl>
              <Link
                href="/winkelwagen"
                onClick={() => setDrawerOpen(false)}
                className="block rounded-xl bg-vondel-700 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-vondel-600"
              >
                {t("viewCart")}
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
