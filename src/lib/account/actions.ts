"use server";

import { revalidatePath } from "next/cache";

import { addItem, getOrCreateUserCart } from "@/lib/cart/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Account mutations run through the user's cookie-bound Supabase client, so
 * RLS (`user_id = auth.uid()`) is the authorization layer — there is no
 * user-id parameter to tamper with.
 */

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  return { supabase, user };
}

export async function updateProfile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("fullName") ?? "").slice(0, 120),
      phone: String(formData.get("phone") ?? "").slice(0, 30) || null,
      marketing_emails: formData.get("marketingEmails") === "on",
      analytics_consent: formData.get("analyticsConsent") === "on",
    })
    .eq("id", user.id);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function changePassword(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const password = String(formData.get("newPassword") ?? "");
  if (password.length < 8) throw new Error("weak_password");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function saveAddress(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const values = {
    user_id: user.id,
    label: String(formData.get("label") ?? "").slice(0, 60),
    first_name: String(formData.get("firstName") ?? "").slice(0, 60),
    last_name: String(formData.get("lastName") ?? "").slice(0, 60),
    street: String(formData.get("street") ?? "").slice(0, 120),
    house_number: String(formData.get("houseNumber") ?? "").slice(0, 10),
    addition: String(formData.get("addition") ?? "").slice(0, 10) || null,
    postcode: String(formData.get("postcode") ?? "").slice(0, 8),
    city: String(formData.get("city") ?? "").slice(0, 80),
  };
  const { error } = id
    ? await supabase.from("addresses").update(values).eq("id", id)
    : await supabase.from("addresses").insert(values);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function deleteAddress(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function setDefaultAddress(id: string): Promise<void> {
  const { supabase, user } = await requireUser();
  // RLS limits both updates to the user's own rows
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  if (error) throw error;
  revalidatePath("/", "layout");
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("product_id", productId);
  if (error) throw error;
  revalidatePath("/", "layout");
}

/** Re-adds all items of one of the user's own orders to their cart. */
export async function reorder(orderId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  // ownership proven through RLS: this select only sees the user's orders
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_items (variant_id, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new Error("not_found");

  const admin = createAdminClient();
  const cartId = await getOrCreateUserCart(admin, user.id);
  for (const item of (order.order_items as unknown as {
    variant_id: string | null;
    quantity: number;
  }[])) {
    if (!item.variant_id) continue;
    await addItem(admin, cartId, item.variant_id, item.quantity).catch(() => {});
  }
}
