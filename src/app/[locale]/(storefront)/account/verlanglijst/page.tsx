import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductCard } from "@/components/catalog/product-card";
import { createStaticClient } from "@/lib/supabase/static";
import { createClient } from "@/lib/supabase/server";
import type { LocalizedText } from "@/types/catalog";

export default async function WishlistPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account.wishlist");

  const supabase = await createClient();
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("product_id")
    .order("created_at", { ascending: false });

  const ids = (wishlist ?? []).map((w) => w.product_id);
  const cards = ids.length
    ? ((await createStaticClient().rpc("product_cards", { p_ids: ids })).data ?? [])
    : [];

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-vondel-900">{t("title")}</h2>
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vondel-200 p-10 text-center text-vondel-500">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {cards.map((p) => (
            <li key={p.id}>
              <ProductCard
                product={{
                  id: p.id,
                  slug: p.slug as LocalizedText,
                  name: p.name as LocalizedText,
                  brand: p.brand,
                  vatRate: p.vat_rate,
                  priceInclCents: p.price_incl_cents,
                  imagePath: p.image_path,
                  inStock: p.in_stock,
                  tagSlugs: p.tag_slugs,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
