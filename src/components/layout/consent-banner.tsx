"use client";

import { useTranslations } from "next-intl";
import Script from "next/script";
import { useEffect, useState } from "react";

const CONSENT_COOKIE = "vc_consent";

type Consent = "accepted" | "declined" | null;

function readConsent(): Consent {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(accepted|declined)`),
  );
  return (match?.[1] as Consent) ?? null;
}

/**
 * AVG-compliant analytics gating: Plausible (cookieless, but still gated to
 * demonstrate consent mode) only loads after an explicit opt-in.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const [consent, setConsent] = useState<Consent | "loading">("loading");

  useEffect(() => {
    // deferred: document.cookie is unavailable during SSR/hydration
    const timeout = setTimeout(() => setConsent(readConsent()), 0);
    return () => clearTimeout(timeout);
  }, []);

  function decide(value: "accepted" | "declined") {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setConsent(value);
  }

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {consent === "accepted" && plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
        />
      )}

      {consent === null && (
        <div
          // a persistent, non-blocking bottom bar — a complementary region,
          // not a modal dialog (so it must not trap focus)
          role="region"
          aria-label={t("title")}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-vondel-200 bg-white p-4 shadow-lg"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-vondel-700">
              <span className="font-semibold">{t("title")}</span> — {t("text")}
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => decide("declined")}
                className="rounded-lg border border-vondel-200 px-4 py-2 text-sm text-vondel-600 hover:border-vondel-400"
              >
                {t("decline")}
              </button>
              <button
                type="button"
                onClick={() => decide("accepted")}
                className="rounded-lg bg-vondel-700 px-4 py-2 text-sm font-semibold text-white hover:bg-vondel-600"
              >
                {t("accept")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
