"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatCents } from "@/lib/format";

interface Props {
  orderId: string;
  token: string;
  orderNumber: string;
  amountCents: number;
}

export function MockPayment({ orderId, token, orderNumber, amountCents }: Props) {
  const t = useTranslations("payment");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(outcome: "paid" | "canceled") {
    setBusy(true);
    try {
      await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token, outcome }),
      });
    } finally {
      router.push({
        pathname: "/bestelling/[orderId]",
        params: { orderId },
        query: { token },
      });
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-vondel-100 bg-white p-8 text-center shadow-sm">
        <span className="mb-4 inline-block rounded-full bg-accent-400/20 px-4 py-1.5 text-sm font-medium text-vondel-800">
          {t("title")}
        </span>
        <p className="mb-6 text-sm text-vondel-500">{t("explainer")}</p>
        <p className="text-sm text-vondel-500">{orderNumber}</p>
        <p className="mb-8 text-4xl font-bold text-vondel-900">
          {formatCents(amountCents, locale)}
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide("paid")}
            className="rounded-xl bg-vondel-700 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-vondel-600 disabled:bg-vondel-200"
          >
            {t("pay")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide("canceled")}
            className="rounded-xl border border-vondel-200 px-6 py-3 text-sm text-vondel-600 hover:border-vondel-400 disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
