"use client";

import { useState, useTransition } from "react";

import { updateProductStatus, updateVariantStockPrice } from "@/lib/admin/actions";

interface VariantRow {
  id: string;
  sku: string;
  priceCents: number | null;
  stockQuantity: number;
}

interface Props {
  product: {
    id: string;
    name: string;
    brand: string;
    status: string;
    basePriceCents: number;
    variants: VariantRow[];
  };
}

const STATUS_NEXT: Record<string, "active" | "archived" | "draft"> = {
  active: "archived",
  archived: "active",
  draft: "active",
};

function VariantEditor({ variant }: { variant: VariantRow }) {
  const [stock, setStock] = useState(String(variant.stockQuantity));
  const [price, setPrice] = useState(variant.priceCents != null ? String(variant.priceCents) : "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const dirty =
    stock !== String(variant.stockQuantity) ||
    price !== (variant.priceCents != null ? String(variant.priceCents) : "");

  return (
    <>
      <td className="px-4 py-1.5 text-right">
        <input
          value={price}
          onChange={(e) => { setPrice(e.target.value); setSaved(false); }}
          placeholder="base"
          aria-label={`Price override ${variant.sku}`}
          className="w-20 rounded border border-vondel-200 px-2 py-1 text-right text-xs"
        />
      </td>
      <td className="px-4 py-1.5 text-right">
        <input
          value={stock}
          onChange={(e) => { setStock(e.target.value); setSaved(false); }}
          aria-label={`Stock ${variant.sku}`}
          className={`w-16 rounded border px-2 py-1 text-right text-xs ${
            Number(stock) === 0 ? "border-red-300 text-red-600" : "border-vondel-200"
          }`}
        />
      </td>
      <td className="px-4 py-1.5">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            startTransition(async () => {
              await updateVariantStockPrice(
                variant.id,
                Number(stock) || 0,
                price.trim() === "" ? null : Number(price) || 0,
              );
              setSaved(true);
            })
          }
          className="rounded border border-vondel-300 px-2 py-1 text-xs font-medium text-vondel-700 hover:border-vondel-500 disabled:opacity-30"
        >
          {saved ? "✓" : "Save"}
        </button>
      </td>
    </>
  );
}

export function ProductRow({ product }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <tr className="bg-white">
        <td className="px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-left font-medium text-vondel-900 hover:text-vondel-600"
          >
            {expanded ? "▾" : "▸"} {product.name}
          </button>
          <span className="block pl-4 text-xs text-vondel-400">{product.brand}</span>
        </td>
        <td className="px-4 py-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() =>
                updateProductStatus(product.id, STATUS_NEXT[product.status] ?? "active"),
              )
            }
            title={`Click to make ${STATUS_NEXT[product.status]}`}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              product.status === "active"
                ? "bg-vondel-100 text-vondel-800"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {product.status}
          </button>
        </td>
        <td className="px-4 py-2 text-xs text-vondel-400">
          {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}
        </td>
        <td className="px-4 py-2 text-right text-vondel-700">{product.basePriceCents}</td>
        <td className="px-4 py-2 text-right text-vondel-700">
          {product.variants.reduce((sum, v) => sum + v.stockQuantity, 0)}
        </td>
        <td />
      </tr>
      {expanded &&
        product.variants.map((variant) => (
          <tr key={variant.id} className="bg-vondel-50/50 text-xs">
            <td className="px-4 py-1.5 pl-10 text-vondel-500" colSpan={2}>
              {variant.sku}
            </td>
            <td />
            <VariantEditor variant={variant} />
          </tr>
        ))}
    </>
  );
}
