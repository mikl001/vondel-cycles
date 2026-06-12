import { getTranslations, setRequestLocale } from "next-intl/server";

import { ReorderButton } from "@/components/account/reorder-button";
import type { Locale } from "@/i18n/routing";
import { formatCents } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-vondel-100 text-vondel-800",
  shipped: "bg-blue-50 text-blue-800",
  delivered: "bg-vondel-100 text-vondel-800",
  pending: "bg-amber-50 text-amber-800",
  cancelled: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
};

export default async function OrdersPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;
  const t = await getTranslations("account.orders");

  // RLS-scoped query: this client only ever sees the logged-in user's orders
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total_incl_cents, tracking_code, confirmation_token, created_at, order_items (id, product_name, quantity)",
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-vondel-900">{t("title")}</h2>
      {!orders?.length ? (
        <p className="rounded-xl border border-dashed border-vondel-200 p-10 text-center text-vondel-500">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-vondel-100 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-vondel-900">
                    {order.order_number}
                  </span>
                  <span className="ml-3 text-sm text-vondel-400">
                    {new Date(order.created_at).toLocaleDateString(
                      locale === "nl" ? "nl-NL" : "en-GB",
                    )}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-vondel-50 text-vondel-600"}`}
                >
                  {t(`statuses.${order.status}` as never)}
                </span>
              </div>

              <ul className="mt-3 text-sm text-vondel-600">
                {(order.order_items as unknown as {
                  id: string;
                  product_name: Record<string, string>;
                  quantity: number;
                }[]).map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.product_name[locale] ?? item.product_name.nl}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-vondel-100 pt-3">
                <span className="font-semibold text-vondel-900">
                  {t("total")}: {formatCents(order.total_incl_cents, locale)}
                </span>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {order.tracking_code && (
                    <span className="text-vondel-600">
                      {t("tracking")}: <code>{order.tracking_code}</code>
                    </span>
                  )}
                  {["paid", "processing", "shipped", "delivered"].includes(order.status) && (
                    <a
                      href={`/api/invoices/${order.id}?token=${order.confirmation_token}`}
                      className="text-vondel-600 underline hover:text-vondel-800"
                    >
                      {t("invoice")}
                    </a>
                  )}
                  <ReorderButton orderId={order.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
