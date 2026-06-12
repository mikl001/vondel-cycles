import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminAuditPage() {
  const admin = createAdminClient();
  const { data: entries } = await admin
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-vondel-900">Audit log</h1>
      <div className="overflow-x-auto rounded-xl border border-vondel-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-vondel-100 text-left text-vondel-500">
            <tr>
              <th className="px-4 py-2.5">When</th>
              <th className="px-4 py-2.5">Actor</th>
              <th className="px-4 py-2.5">Action</th>
              <th className="px-4 py-2.5">Entity</th>
              <th className="px-4 py-2.5">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vondel-50">
            {(entries ?? []).map((entry) => (
              <tr key={entry.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-2 text-vondel-500">
                  {entry.created_at.slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-2">{entry.actor_email ?? "—"}</td>
                <td className="px-4 py-2 font-medium text-vondel-900">{entry.action}</td>
                <td className="px-4 py-2 text-vondel-500">
                  {entry.entity_type}
                  {entry.entity_id && (
                    <span className="block text-xs">{entry.entity_id.slice(0, 8)}…</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <code className="text-xs text-vondel-600">
                    {entry.diff ? JSON.stringify(entry.diff) : ""}
                  </code>
                </td>
              </tr>
            ))}
            {!entries?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-vondel-400">
                  No admin actions logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
