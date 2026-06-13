import { NextRequest, NextResponse } from "next/server";

import { getEmailAdapter } from "@/lib/adapters/email";
import { siteUrl } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";

const STALE_AFTER_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Abandoned-cart trigger. Wire as a Vercel cron (e.g. every hour) with
 * CRON_SECRET; each cart is mailed at most once.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  const admin = createAdminClient();
  const email = getEmailAdapter();

  // Drain in oldest-first batches so no cart is starved, bounded so a runaway
  // backlog can't turn one cron tick into an unbounded mail loop.
  const BATCH = 100;
  const MAX_BATCHES = 20;
  let candidates = 0;
  let notified = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data: carts, error } = await admin
      .from("carts")
      .select("id, email, cart_items (id)")
      .eq("status", "active")
      .not("email", "is", null)
      .is("abandoned_notified_at", null)
      .lt("updated_at", cutoff)
      .order("updated_at", { ascending: true })
      .limit(BATCH);
    if (error) {
      console.error("[abandoned-carts] query failed:", error);
      return NextResponse.json({ error: "error" }, { status: 500 });
    }
    if (!carts.length) break;
    candidates += carts.length;

    for (const cart of carts) {
      // empty carts still get marked so they don't reappear every run
      if ((cart.cart_items as unknown as { id: string }[]).length) {
        try {
          await email.send({
            to: cart.email!,
            subject: "Je winkelwagen wacht op je / Your cart is waiting (demo)",
            text:
              `Je liet wat moois achter in je winkelwagen bij Vondel Cycles!\n` +
              `You left something nice in your cart at Vondel Cycles!\n\n` +
              `${siteUrl()}/nl/winkelwagen\n\n(Demo-webshop — geen echte bestellingen.)`,
          });
          notified++;
        } catch (err) {
          console.error(`[abandoned-carts] mail failed for ${cart.id}:`, err);
        }
      }
      await admin
        .from("carts")
        .update({ abandoned_notified_at: new Date().toISOString() })
        .eq("id", cart.id);
    }
    if (carts.length < BATCH) break;
  }

  return NextResponse.json({ candidates, notified });
}
