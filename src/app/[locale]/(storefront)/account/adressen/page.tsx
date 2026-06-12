import { getTranslations, setRequestLocale } from "next-intl/server";

import { AddressManager, type AddressView } from "@/components/account/address-manager";
import { createClient } from "@/lib/supabase/server";

export default async function AddressesPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.addresses");

  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .order("created_at");

  const addresses: AddressView[] = (data ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    firstName: a.first_name,
    lastName: a.last_name,
    street: a.street,
    houseNumber: a.house_number,
    addition: a.addition ?? "",
    postcode: a.postcode,
    city: a.city,
    isDefault: a.is_default,
  }));

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-vondel-900">{t("title")}</h2>
      <AddressManager addresses={addresses} />
    </div>
  );
}
