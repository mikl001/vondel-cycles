import { NextRequest, NextResponse } from "next/server";

import { audit, getAdminContext } from "@/lib/admin/guard";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

const HEADER = "sku,product_name_nl,status,base_price_excl_cents,variant_price_excl_cents,stock_quantity";

function csvEscape(value: string): string {
  // Neutralize CSV formula injection: a cell beginning with = + - @ (or a
  // leading tab/CR) is treated as a formula by spreadsheet apps. Prefix with a
  // single quote so the value is rendered as literal text.
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** Variant-level product export. */
export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: products, error } = await admin
    .from("products")
    .select("name, status, base_price_cents, product_variants (sku, price_cents, stock_quantity)")
    .order("created_at");
  if (error) return NextResponse.json({ error: "error" }, { status: 500 });

  const lines = [HEADER];
  for (const product of products) {
    const name = (product.name as Record<string, string>).nl ?? "";
    for (const variant of product.product_variants as unknown as {
      sku: string;
      price_cents: number | null;
      stock_quantity: number;
    }[]) {
      lines.push(
        [
          variant.sku,
          csvEscape(name),
          product.status,
          String(product.base_price_cents),
          variant.price_cents != null ? String(variant.price_cents) : "",
          String(variant.stock_quantity),
        ].join(","),
      );
    }
  }

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vondel-products.csv"',
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Bulk import: updates variant price overrides and stock by SKU.
 * Unknown SKUs are reported back, nothing is created — the import is a
 * bulk-update tool, not a product creator.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const text = await request.text();
  if (text.length > 1_000_000) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const rows = text.split(/\r?\n/).filter((line) => line.trim());
  if (!rows[0]?.startsWith("sku,")) {
    return NextResponse.json({ error: "invalid_header" }, { status: 400 });
  }
  const header = rows[0].split(",");
  const skuIdx = header.indexOf("sku");
  const priceIdx = header.indexOf("variant_price_excl_cents");
  const stockIdx = header.indexOf("stock_quantity");
  if (skuIdx < 0 || stockIdx < 0) {
    return NextResponse.json({ error: "invalid_header" }, { status: 400 });
  }

  const admin = createAdminClient();
  let updated = 0;
  const unknown: string[] = [];

  for (const row of rows.slice(1)) {
    // naive split is fine: sku/price/stock columns never contain commas
    const cols = row.split(",");
    const sku = cols[skuIdx]?.trim();
    if (!sku) continue;
    const stock = Number(cols[stockIdx]);
    const priceRaw = priceIdx >= 0 ? (cols[priceIdx]?.trim() ?? "") : "";
    if (!Number.isInteger(stock) || stock < 0 || stock > 9999) {
      unknown.push(sku);
      continue;
    }
    // empty price cell clears the override; a present cell must be a valid
    // non-negative integer (0 is a legitimate override, not a clear)
    let priceCents: number | null = null;
    if (priceRaw !== "") {
      const p = Number(priceRaw);
      if (!Number.isInteger(p) || p < 0 || p > 100_000_000) {
        unknown.push(sku);
        continue;
      }
      priceCents = p;
    }

    const { data, error } = await admin
      .from("product_variants")
      .update({ stock_quantity: stock, price_cents: priceCents })
      .eq("sku", sku)
      .select("id");
    if (error || !data?.length) unknown.push(sku);
    else updated++;
  }

  await audit(ctx, "products.csv_import", "product_variant", null, {
    updated,
    unknown: unknown.slice(0, 20),
  });

  return NextResponse.json({ updated, unknown });
}
