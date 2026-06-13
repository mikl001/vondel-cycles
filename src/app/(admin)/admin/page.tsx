import { formatEur as eur } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const [{ data: sales }, { data: lowStock }, { count: customerCount }] =
    await Promise.all([
      admin.from("admin_sales_per_day").select("*").limit(14),
      admin.from("admin_low_stock").select("*").limit(12),
      admin.from("profiles").select("id", { count: "exact", head: true }),
    ]);

  // orders / revenue_cents are Postgres bigint -> PostgREST serializes them as
  // JSON strings; coerce with Number() before any arithmetic so the KPI cards
  // sum rather than string-concatenate ("0" + "3" + "5").
  const totals = (sales ?? []).reduce(
    (acc, day) => ({
      orders: acc.orders + Number(day.orders),
      revenue: acc.revenue + Number(day.revenue_cents),
    }),
    { orders: 0, revenue: 0 },
  );
  const aov = totals.orders ? Math.round(totals.revenue / totals.orders) : 0;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-vondel-900">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders (14d)", value: String(totals.orders) },
          { label: "Revenue (14d)", value: eur(totals.revenue) },
          { label: "Avg order value", value: eur(aov) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-vondel-200 bg-white p-5">
            <p className="text-sm text-vondel-500">{kpi.label}</p>
            <p className="mt-1 text-3xl font-bold text-vondel-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-vondel-900">Sales per day</h2>
        <div className="overflow-x-auto rounded-xl border border-vondel-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-vondel-100 text-left text-vondel-500">
              <tr>
                <th className="px-4 py-2.5">Day</th>
                <th className="px-4 py-2.5 text-right">Orders</th>
                <th className="px-4 py-2.5 text-right">Revenue</th>
                <th className="px-4 py-2.5 text-right">AOV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vondel-50">
              {(sales ?? []).map((day) => (
                <tr key={day.day}>
                  <td className="px-4 py-2">{day.day}</td>
                  <td className="px-4 py-2 text-right">{Number(day.orders)}</td>
                  <td className="px-4 py-2 text-right">{eur(Number(day.revenue_cents))}</td>
                  <td className="px-4 py-2 text-right">{eur(Number(day.avg_order_cents))}</td>
                </tr>
              ))}
              {!sales?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-vondel-400">
                    No paid orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-vondel-900">
          Low stock alerts{" "}
          <span className="text-sm font-normal text-vondel-400">
            ({customerCount ?? 0} registered customers total)
          </span>
        </h2>
        {!lowStock?.length ? (
          <p className="rounded-xl border border-dashed border-vondel-200 p-6 text-center text-sm text-vondel-400">
            All variants above their threshold
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((item) => (
              <li
                key={item.variant_id}
                className={`flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm ${
                  item.stock_quantity === 0 ? "border-red-300" : "border-amber-200"
                }`}
              >
                <span>
                  <span className="font-medium text-vondel-900">
                    {(item.product_name as Record<string, string>).nl}
                  </span>
                  <span className="block text-xs text-vondel-400">{item.sku}</span>
                </span>
                <span
                  className={`font-bold ${item.stock_quantity === 0 ? "text-red-600" : "text-amber-600"}`}
                >
                  {item.stock_quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
