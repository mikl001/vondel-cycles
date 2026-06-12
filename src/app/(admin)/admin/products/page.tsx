import { ProductRow } from "@/components/admin/product-row";
import { CsvImport } from "@/components/admin/csv-import";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminProductsPage() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select(
      "id, name, brand, status, vat_rate, base_price_cents, product_variants (id, sku, options, price_cents, stock_quantity)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-vondel-900">
          Products{" "}
          <span className="text-base font-normal text-vondel-400">
            ({products?.length ?? 0})
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/api/admin/products/csv"
            download
            className="rounded-lg border border-vondel-300 px-4 py-2 text-sm font-medium text-vondel-700 hover:border-vondel-500"
          >
            ⬇ Export CSV
          </a>
          <CsvImport />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-vondel-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-vondel-100 text-left text-vondel-500">
            <tr>
              <th className="px-4 py-2.5">Product</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">SKU</th>
              <th className="px-4 py-2.5 text-right">Price excl. (¢)</th>
              <th className="px-4 py-2.5 text-right">Stock</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vondel-50">
            {(products ?? []).map((product) => (
              <ProductRow
                key={product.id}
                product={{
                  id: product.id,
                  name: (product.name as Record<string, string>).nl,
                  brand: product.brand,
                  status: product.status,
                  basePriceCents: product.base_price_cents,
                  variants: (
                    product.product_variants as unknown as {
                      id: string;
                      sku: string;
                      price_cents: number | null;
                      stock_quantity: number;
                    }[]
                  ).map((v) => ({
                    id: v.id,
                    sku: v.sku,
                    priceCents: v.price_cents,
                    stockQuantity: v.stock_quantity,
                  })),
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
