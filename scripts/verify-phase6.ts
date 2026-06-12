/**
 * Phase 6 verification: cart merge on login + profile trigger.
 * Run: npx tsx --conditions=react-server scripts/verify-phase6.ts
 * (the react-server condition satisfies the "server-only" import guards)
 */
import { randomUUID } from "node:crypto";

process.loadEnvFile(".env.local");

async function main() {
  const { createAdminClient } = await import("../src/lib/supabase/admin");
  const { addItem, createGuestCart, getCartIdByUser, mergeGuestCartIntoUserCart } =
    await import("../src/lib/cart/server");

  const admin = createAdminClient();
  // user with an existing cart
  const { data: created, error } = await admin.auth.admin.createUser({
    email: `merge-test-${Date.now()}@example.com`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { full_name: "Merge Tester" },
  });
  if (error) throw error;
  const userId = created.user.id;

  // profile trigger fired?
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();
  console.log(`profile auto-created: ${profile?.full_name === "Merge Tester" ? "OK" : "FAIL"}`);

  const { data: variants } = await admin
    .from("product_variants")
    .select("id")
    .gt("stock_quantity", 5)
    .limit(2);
  const [v1, v2] = variants!.map((v) => v.id);

  // user cart with v1 x1; guest cart with v1 x2 + v2 x1
  const { data: userCart } = await admin
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  await addItem(admin, userCart!.id, v1, 1);

  const token = randomUUID();
  const guestCartId = await createGuestCart(admin, token);
  await addItem(admin, guestCartId, v1, 2);
  await addItem(admin, guestCartId, v2, 1);

  await mergeGuestCartIntoUserCart(admin, token, userId);

  const mergedCartId = await getCartIdByUser(admin, userId);
  const { data: items } = await admin
    .from("cart_items")
    .select("variant_id, quantity")
    .eq("cart_id", mergedCartId!);

  const q1 = items!.find((i) => i.variant_id === v1)?.quantity;
  const q2 = items!.find((i) => i.variant_id === v2)?.quantity;
  console.log(`merged quantities: v1=${q1} (want 3), v2=${q2} (want 1) -> ${q1 === 3 && q2 === 1 ? "OK" : "FAIL"}`);

  const { data: guestGone } = await admin
    .from("carts")
    .select("id")
    .eq("anon_token", token);
  console.log(`guest cart removed: ${guestGone!.length === 0 ? "OK" : "FAIL"}`);

  // cleanup
  await admin.auth.admin.deleteUser(userId);
  console.log("cleanup done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
