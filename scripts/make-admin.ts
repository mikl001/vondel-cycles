/**
 * Grants (or creates) an admin user.
 * Usage: npx tsx --conditions=react-server scripts/make-admin.ts admin@example.com [password]
 */
process.loadEnvFile(".env.local");

async function main() {
  const email = process.argv[2];
  const password = process.argv[3] ?? "admin-demo-123";
  if (!email?.includes("@")) {
    console.error("Usage: npx tsx --conditions=react-server scripts/make-admin.ts <email> [password]");
    process.exit(1);
  }

  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const admin = createAdminClient();

  // find or create the user
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  let user = list.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Shop Admin" },
    });
    if (error) throw error;
    user = data.user;
    console.log(`created user ${email} (password: ${password})`);
  }

  const { error } = await admin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" });
  if (error) throw error;
  console.log(`${email} is now admin. Re-login to refresh the JWT claim.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
