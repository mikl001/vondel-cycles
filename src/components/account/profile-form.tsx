"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { changePassword, updateProfile } from "@/lib/account/actions";

const inputCls =
  "w-full rounded-lg border border-vondel-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-vondel-500";
const labelCls = "mb-1 block text-sm font-medium text-vondel-700";

interface Props {
  email: string;
  profile: {
    fullName: string;
    phone: string;
    marketingEmails: boolean;
    analyticsConsent: boolean;
  };
}

export function ProfileForm({ email, profile }: Props) {
  const t = useTranslations("account.profile");
  const ta = useTranslations("auth");
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-vondel-100 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-vondel-900">{t("title")}</h2>
        <form
          action={(formData) =>
            startTransition(async () => {
              await updateProfile(formData);
              setSaved(true);
            })
          }
          className="flex flex-col gap-3"
        >
          <div>
            <label className={labelCls}>{ta("email")}</label>
            <input value={email} disabled className={`${inputCls} bg-vondel-50 text-vondel-400`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className={labelCls}>{ta("fullName")}</label>
              <input id="fullName" name="fullName" defaultValue={profile.fullName} className={inputCls} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>Tel.</label>
              <input id="phone" name="phone" defaultValue={profile.phone} className={inputCls} />
            </div>
          </div>

          <h3 className="mt-2 text-sm font-semibold text-vondel-800">{t("consents")}</h3>
          <label className="flex items-center gap-2 text-sm text-vondel-700">
            <input
              type="checkbox"
              name="marketingEmails"
              defaultChecked={profile.marketingEmails}
              className="h-4 w-4 accent-vondel-600"
            />
            {t("marketingEmails")}
          </label>
          <label className="flex items-center gap-2 text-sm text-vondel-700">
            <input
              type="checkbox"
              name="analyticsConsent"
              defaultChecked={profile.analyticsConsent}
              className="h-4 w-4 accent-vondel-600"
            />
            {t("analyticsConsent")}
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-vondel-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-vondel-600 disabled:bg-vondel-200"
            >
              {t("save")}
            </button>
            {saved && <span className="text-sm font-medium text-vondel-600">✓ {t("saved")}</span>}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-vondel-100 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-vondel-900">{ta("password")}</h2>
        <form
          action={(formData) =>
            startTransition(async () => {
              await changePassword(formData);
              setPasswordSaved(true);
            })
          }
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <label htmlFor="newPassword" className={labelCls}>{ta("password")}</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl border border-vondel-300 px-5 py-2.5 text-sm font-medium text-vondel-700 hover:border-vondel-500 disabled:opacity-50"
          >
            {t("save")}
          </button>
          {passwordSaved && <span className="pb-2.5 text-sm text-vondel-600">✓</span>}
        </form>
      </section>
    </div>
  );
}
