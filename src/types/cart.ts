import type { CartTotals } from "@/lib/cart/totals";
import type { LocalizedText, VariantOption } from "@/types/catalog";

export interface CartItemView {
  id: string;
  variantId: string;
  quantity: number;
  /** quantity was clamped to the available stock on the last mutation */
  adjusted?: boolean;
  sku: string;
  options: Record<string, VariantOption>;
  stockQuantity: number;
  productSlug: LocalizedText;
  productName: LocalizedText;
  brand: string;
  imagePath: string | null;
  vatRate: number;
  unitPriceExclCents: number;
  unitPriceInclCents: number;
  lineInclCents: number;
}

export interface CartView {
  items: CartItemView[];
  totals: CartTotals;
  itemCount: number;
}

export const EMPTY_CART: CartView = {
  items: [],
  totals: {
    subtotalExclCents: 0,
    vatBreakdown: {},
    vatTotalCents: 0,
    totalInclCents: 0,
  },
  itemCount: 0,
};
