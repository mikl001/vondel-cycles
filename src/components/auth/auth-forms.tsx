"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  sendMagicLink,
  sendPasswordReset,
  signIn,
  signUp,
  type AuthState,
} from "@/lib/auth/actions";

const inputCls =
  "w-full rounded-lg border border-vondel-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-vondel-500";
const labelCls = "mb-1 block text-sm font-medium text-vondel-700";
const buttonCls =
  "w-full rounded-xl bg-vondel-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-vondel-600 disabled:bg-vondel-200";

function AuthError({ state }: { state: AuthState }) {
  const t = useTranslations("auth");
  if (!state.error) return null;
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {t(`errors.${state.error}`)}
    </p>
  );
}

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [state, action, pending] = useActionState(signIn.bind(null, locale), {});
  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLink.bind(null, locale),
    {},
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <div>
          <label htmlFor="email" className={labelCls}>{t("email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
        </div>
        <div>
          <label htmlFor="password" className={labelCls}>{t("password")}</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className={inputCls} />
        </div>
        <AuthError state={state} />
        <button type="submit" disabled={pending} className={buttonCls}>
          {t("loginButton")}
        </button>
      </form>

      <form action={magicAction} className="flex flex-col gap-2">
        {/* reuses the email field value via FormData when submitted standalone */}
        <input type="hidden" name="locale" value={locale} />
        <label htmlFor="magic-email" className="sr-only">{t("email")}</label>
        <input
          id="magic-email"
          name="email"
          type="email"
          placeholder={t("email")}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={magicPending}
          className="rounded-xl border border-vondel-300 px-6 py-2.5 text-sm font-medium text-vondel-700 hover:border-vondel-500 disabled:opacity-50"
        >
          {t("magicLink")}
        </button>
        {magicState.sent && (
          <p className="text-sm font-medium text-vondel-600">✓ {t("magicLinkSent")}</p>
        )}
        <AuthError state={magicState} />
      </form>

      <div className="flex justify-between text-sm">
        <Link href="/wachtwoord-vergeten" className="text-vondel-600 underline hover:text-vondel-800">
          {t("forgotPassword")}
        </Link>
        <Link href="/registreren" className="text-vondel-600 underline hover:text-vondel-800">
          {t("noAccount")} {t("register")}
        </Link>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [state, action, pending] = useActionState(signUp.bind(null, locale), {});

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <div>
          <label htmlFor="fullName" className={labelCls}>{t("fullName")}</label>
          <input id="fullName" name="fullName" required autoComplete="name" className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>{t("email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
        </div>
        <div>
          <label htmlFor="password" className={labelCls}>{t("password")}</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
        </div>
        <AuthError state={state} />
        {state.sent && <p className="text-sm font-medium text-vondel-600">✓ {t("checkEmail")}</p>}
        <button type="submit" disabled={pending} className={buttonCls}>
          {t("registerButton")}
        </button>
      </form>
      <p className="text-sm">
        <Link href="/login" className="text-vondel-600 underline hover:text-vondel-800">
          {t("haveAccount")} {t("login")}
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [state, action, pending] = useActionState(
    sendPasswordReset.bind(null, locale),
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="email" className={labelCls}>{t("email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
      </div>
      <AuthError state={state} />
      {state.sent && <p className="text-sm font-medium text-vondel-600">✓ {t("resetSent")}</p>}
      <button type="submit" disabled={pending} className={buttonCls}>
        {t("resetButton")}
      </button>
    </form>
  );
}
