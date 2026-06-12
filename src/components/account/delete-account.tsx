"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function DeleteAccount() {
  const t = useTranslations("account.privacy");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const requiredWord = locale === "nl" ? "VERWIJDER" : "DELETE";

  async function deleteAccount() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (res.ok) {
        window.dispatchEvent(new Event("cart:refresh"));
        router.push("/");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-red-200 bg-red-50/50 p-5">
      <h3 className="mb-1 font-semibold text-red-800">{t("deleteTitle")}</h3>
      <p className="mb-4 text-sm text-vondel-600">{t("deleteText")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("deleteConfirm")}
          aria-label={t("deleteConfirm")}
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
        />
        <button
          type="button"
          disabled={confirm !== requiredWord || busy}
          onClick={deleteAccount}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200"
        >
          {t("deleteButton")}
        </button>
      </div>
    </section>
  );
}
