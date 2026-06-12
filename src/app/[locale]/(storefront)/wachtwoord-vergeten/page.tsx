import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/auth/auth-forms";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("forgotPassword"), robots: { index: false, follow: true } };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-vondel-900">
        {t("forgotPassword")}
      </h1>
      <ForgotPasswordForm />
    </div>
  );
}
