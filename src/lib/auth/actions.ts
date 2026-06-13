"use server";

import { cookies, headers } from "next/headers";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CART_COOKIE, mergeGuestCartIntoUserCart } from "@/lib/cart/server";
import { ipFromHeaders, LIMITS, rateLimitByKey } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?:
    | "invalid_credentials"
    | "user_already_exists"
    | "weak_password"
    | "rate_limited"
    | "error";
  sent?: boolean;
}

function mapAuthError(code: string | undefined): AuthState["error"] {
  if (code === "invalid_credentials") return "invalid_credentials";
  if (code === "user_already_exists" || code === "email_exists")
    return "user_already_exists";
  if (code === "weak_password") return "weak_password";
  return "error";
}

/** Per-IP throttle for the auth actions — defense-in-depth against brute
 *  force, credential stuffing and email bombing (GoTrue's own caps are a
 *  shared global SMTP budget, not per-IP). Returns true when allowed. */
async function authRateOk(): Promise<boolean> {
  return rateLimitByKey("auth", ipFromHeaders(await headers()), LIMITS.auth);
}

async function mergeCartAfterLogin(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CART_COOKIE)?.value;
  if (!token) return;
  try {
    await mergeGuestCartIntoUserCart(createAdminClient(), token, userId);
    cookieStore.delete(CART_COOKIE);
  } catch (err) {
    console.error("[auth] cart merge failed:", err);
  }
}

export async function signIn(
  locale: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!(await authRateOk())) return { error: "rate_limited" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: mapAuthError(error.code) };

  await mergeCartAfterLogin(data.user.id);
  redirect({ href: "/account", locale });
  return {};
}

export async function signUp(
  locale: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!(await authRateOk())) return { error: "rate_limited" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    options: {
      data: { full_name: String(formData.get("fullName") ?? "") },
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/${locale}/account`,
    },
  });
  if (error) return { error: mapAuthError(error.code) };

  // local config has confirmations off -> session exists immediately
  if (data.session && data.user) {
    await mergeCartAfterLogin(data.user.id);
    redirect({ href: "/account", locale });
  }
  return { sent: true };
}

export async function sendMagicLink(
  locale: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!(await authRateOk())) return { error: "rate_limited" };
  const email = String(formData.get("email") ?? "");
  if (!email.includes("@")) return { error: "error" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/${locale}/account`,
    },
  });
  if (error) return { error: "error" };
  return { sent: true };
}

export async function sendPasswordReset(
  locale: Locale,
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!(await authRateOk())) return { error: "rate_limited" };
  const email = String(formData.get("email") ?? "");
  if (!email.includes("@")) return { error: "error" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/${locale}/account`,
  });
  if (error) return { error: "error" };
  return { sent: true };
}

export async function signOut(locale: Locale): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/", locale });
}
