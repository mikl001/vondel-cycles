import { formatEur as eur } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCustomersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: orders }, { data: users }] = await Promise.all([
    admin.from("profiles").select("id, full_name, created_at"),
    admin
      .from("orders")
      .select("user_id, total_incl_cents, status")
      .not("user_id", "is", null),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const emailById = new Map(users.users.map((u) => [u.id, u.email ?? ""]));
  const orderStats = new Map<string, { count: number; revenue: number }>();
  for (const order of orders ?? []) {
    if (!order.user_id) continue;
    if (!["paid", "processing", "shipped", "delivered"].includes(order.status)) continue;
    const stats = orderStats.get(order.user_id) ?? { count: 0, revenue: 0 };
    stats.count++;
    stats.revenue += order.total_incl_cents;
    orderStats.set(order.user_id, stats);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-vondel-900">
        Customers{" "}
        <span className="text-base font-normal text-vondel-400">
          ({profiles?.length ?? 0})
        </span>
      </h1>
      <div className="overflow-x-auto rounded-xl border border-vondel-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-vondel-100 text-left text-vondel-500">
            <tr>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Registered</th>
              <th className="px-4 py-2.5 text-right">Paid orders</th>
              <th className="px-4 py-2.5 text-right">Lifetime value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vondel-50">
            {(profiles ?? []).map((profile) => {
              const stats = orderStats.get(profile.id);
              return (
                <tr key={profile.id}>
                  <td className="px-4 py-2.5 font-medium text-vondel-900">
                    {profile.full_name || "—"}
                  </td>
                  <td className="px-4 py-2.5">{emailById.get(profile.id) ?? "—"}</td>
                  <td className="px-4 py-2.5 text-vondel-500">
                    {profile.created_at.slice(0, 10)}
                  </td>
                  <td className="px-4 py-2.5 text-right">{stats?.count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right">{eur(stats?.revenue ?? 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
