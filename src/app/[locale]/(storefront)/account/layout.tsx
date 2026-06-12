import { getTranslations, setRequestLocale } from "next-intl/server";

import { AccountNav } from "@/components/account/account-nav";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

export default async function AccountLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/login", locale: locale as Locale });

  const t = await getTranslations("account");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-vondel-900">
        {t("title")}
      </h1>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <AccountNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
