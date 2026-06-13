import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProfileForm } from "@/components/account/profile-form";
import { CartRefreshOnMount } from "@/components/cart/cart-refresh-on-mount";
import { createClient } from "@/lib/supabase/server";

export default async function AccountOverviewPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, marketing_emails, analytics_consent")
    .eq("id", user!.id)
    .single();

  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-6">
      {/* a guest cart may have just merged into this account on login */}
      <CartRefreshOnMount />
      <p className="text-vondel-600">
        {t("welcome")}, {profile?.full_name || user!.email} 👋
      </p>
      <ProfileForm
        email={user!.email ?? ""}
        profile={{
          fullName: profile?.full_name ?? "",
          phone: profile?.phone ?? "",
          marketingEmails: profile?.marketing_emails ?? false,
          analyticsConsent: profile?.analytics_consent ?? false,
        }}
      />
    </div>
  );
}
