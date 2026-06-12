import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RegisterForm } from "@/components/auth/auth-forms";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("register"), robots: { index: false, follow: true } };
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect({ href: "/account", locale: locale as Locale });

  const t = await getTranslations("auth");
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-vondel-900">
        {t("register")}
      </h1>
      <RegisterForm />
    </div>
  );
}
