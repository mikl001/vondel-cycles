import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

// Integration test against the LOCAL Supabase stack. Skipped automatically when
// the env isn't present (e.g. CI without a database). Run locally with:
//   $env:NEXT_PUBLIC_SUPABASE_URL=...; $env:SUPABASE_SECRET_KEY=...; npm test
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && key);

describe.skipIf(!enabled)("finalize_order (integration)", () => {
  // constructed only when enabled — the describe body still runs during
  // collection for a skipped suite, so guard against undefined url/key
  const db = enabled
    ? createClient(url!, key!, { auth: { persistSession: false } })
    : (undefined as unknown as ReturnType<typeof createClient>);
  const createdOrderIds: string[] = [];
  let variantId = "";
  let originalStock = 0;

  async function makePendingOrder(): Promise<string> {
    const { data: order } = await db
      .from("orders")
      .insert({
        email: "integration@test.example",
        shipping_address: {},
        billing_address: {},
        shipping_method_code: "postnl-standard",
        subtotal_excl_cents: 1000,
        total_incl_cents: 1210,
        status: "pending",
      })
      .select("id")
      .single();
    const id = order!.id as string;
    createdOrderIds.push(id);
    await db.from("order_items").insert({
      order_id: id,
      variant_id: variantId,
      product_name: { nl: "x", en: "x" },
      sku: `INT-${id.slice(0, 8)}`,
      unit_price_excl_cents: 1000,
      vat_rate: 21,
      quantity: 1,
    });
    return id;
  }

  afterAll(async () => {
    for (const id of createdOrderIds) {
      await db.from("orders").delete().eq("id", id);
    }
    if (variantId) {
      await db
        .from("product_variants")
        .update({ stock_quantity: originalStock })
        .eq("id", variantId);
    }
  });

  it("pays the first order, leaves the second oversold, and is idempotent", async () => {
    const { data: variant } = await db
      .from("product_variants")
      .select("id, stock_quantity")
      .gte("stock_quantity", 5)
      .limit(1)
      .single();
    variantId = variant!.id as string;
    originalStock = variant!.stock_quantity as number;
    await db.from("product_variants").update({ stock_quantity: 1 }).eq("id", variantId);

    const o1 = await makePendingOrder();
    const o2 = await makePendingOrder();

    // first finalize wins the unit
    const r1 = await db.rpc("finalize_order", {
      p_order_id: o1,
      p_paid: true,
      p_failed_status: "cancelled",
    });
    expect(r1.data?.[0]?.outcome).toBe("paid");

    // second loses the stock race -> oversold + cancelled
    const r2 = await db.rpc("finalize_order", {
      p_order_id: o2,
      p_paid: true,
      p_failed_status: "cancelled",
    });
    expect(r2.data?.[0]?.outcome).toBe("oversold");

    // idempotent replay of the first is a no-op
    const replay = await db.rpc("finalize_order", {
      p_order_id: o1,
      p_paid: true,
      p_failed_status: "cancelled",
    });
    expect(replay.data?.[0]?.applied).toBe(false);

    // stock landed at exactly 0 (decremented once, never below zero)
    const { data: after } = await db
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .single();
    expect(after!.stock_quantity).toBe(0);

    const { data: oversoldEvent } = await db
      .from("order_events")
      .select("event_type")
      .eq("order_id", o2)
      .eq("event_type", "oversold");
    expect(oversoldEvent?.length).toBe(1);
  });
});
