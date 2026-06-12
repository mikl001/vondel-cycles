"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { reorder } from "@/lib/account/actions";

export function ReorderButton({ orderId }: { orderId: string }) {
  const t = useTranslations("account.orders");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await reorder(orderId);
            setDone(true);
            window.dispatchEvent(new Event("cart:refresh"));
          })
        }
        className="rounded-lg border border-vondel-300 px-3 py-1.5 font-medium text-vondel-700 hover:border-vondel-500 disabled:opacity-50"
      >
        {t("reorder")}
      </button>
      {done && <span className="text-xs text-vondel-600">✓ {t("reordered")}</span>}
    </span>
  );
}
