import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
  email: string;
}

/**
 * Admin authorization. The JWT carries app_role via the custom access token
 * hook, but the claim is only refreshed on token rotation — so the source of
 * truth here is the user_roles table (fresh on every request).
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) return null;

  return { userId: user.id, email: user.email ?? "" };
}

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new Error("forbidden");
  return ctx;
}

/** One audit row per admin mutation. */
export async function audit(
  ctx: AdminContext,
  action: string,
  entityType: string,
  entityId: string | null,
  diff?: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    actor_id: ctx.userId,
    actor_email: ctx.email,
    action,
    entity_type: entityType,
    entity_id: entityId,
    diff: (diff ?? null) as never,
  });
  if (error) console.error("[audit] failed:", error);
}
