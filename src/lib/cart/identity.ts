import "server-only";

import { cookies } from "next/headers";

import {
  CART_COOKIE,
  getCartIdByToken,
  getOrCreateUserCart,
} from "@/lib/cart/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CartIdentity {
  userId: string | null;
  /** valid guest token from the cookie, if any */
  token: string | null;
  /** active cart id (null when nothing exists yet) */
  cartId: string | null;
}

/**
 * Single place that decides whose cart a request operates on: the logged-in
 * user's cart wins; otherwise the HttpOnly guest token.
 */
export async function resolveCartIdentity(): Promise<CartIdentity> {
  const supabase = createAdminClient();

  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(CART_COOKIE)?.value;
  const token = rawToken && UUID_RE.test(rawToken) ? rawToken : null;

  if (user) {
    const cartId = await getOrCreateUserCart(supabase, user.id);
    return { userId: user.id, token, cartId };
  }

  return {
    userId: null,
    token,
    cartId: token ? await getCartIdByToken(supabase, token) : null,
  };
}
