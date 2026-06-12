import { OrderRowActions } from "@/components/admin/order-row-actions";
import { createAdminClient } from "@/lib/supabase/admin";

const eur = (cents: number) => `€ ${(cents / 100).toFixed(2)}`;

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select(
      "id, order_number, email, status, total_incl_cents, payment_provider, tracking_code, customer_type, created_at, order_items (id)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-vondel-900">
        Orders{" "}
        <span className="text-base font-normal text-vondel-400">
          (latest {orders?.length ?? 0})
        </span>
      </h1>

      <div className="overflow-x-auto rounded-xl border border-vondel-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-vondel-100 text-left text-vondel-500">
            <tr>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-4 py-2.5">Customer</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Tracking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vondel-50">
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="align-top">
                <td className="px-4 py-2.5">
                  <span className="font-medium text-vondel-900">{order.order_number}</span>
                  <span className="block text-xs text-vondel-400">
                    {new Date(order.created_at).toISOString().slice(0, 16).replace("T", " ")}
                    {" · "}
                    {(order.order_items as unknown as { id: string }[]).length} item(s)
                    {" · "}
                    {order.payment_provider}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {order.email}
                  {order.customer_type === "b2b" && (
                    <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                      B2B
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-vondel-900">
                  {eur(order.total_incl_cents)}
                </td>
                <OrderRowActions
                  orderId={order.id}
                  status={order.status}
                  trackingCode={order.tracking_code ?? ""}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
