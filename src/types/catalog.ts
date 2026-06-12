import type { Locale } from "@/i18n/routing";

export type LocalizedText = Record<Locale, string>;

export interface CategoryNode {
  id: string;
  parentId: string | null;
  slug: LocalizedText;
  name: LocalizedText;
  description: LocalizedText | null;
  sortOrder: number;
  children: CategoryNode[];
}

export interface ProductSpec {
  label: LocalizedText;
  value: LocalizedText;
}

export interface VariantOption {
  value: string;
  label: LocalizedText;
}

export interface ProductVariant {
  id: string;
  sku: string;
  options: Record<string, VariantOption>;
  priceCents: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface ProductImage {
  storagePath: string;
  alt: LocalizedText | null;
  sortOrder: number;
}

/** Lightweight shape for listing/grid cards */
export interface ProductCard {
  id: string;
  slug: LocalizedText;
  name: LocalizedText;
  brand: string;
  vatRate: number;
  basePriceCents: number;
  imagePath: string | null;
  inStock: boolean;
  tagSlugs: string[];
}

export interface ProductDetail {
  id: string;
  categoryId: string;
  slug: LocalizedText;
  name: LocalizedText;
  description: LocalizedText | null;
  specs: ProductSpec[];
  brand: string;
  vatRate: number;
  basePriceCents: number;
  variants: ProductVariant[];
  images: ProductImage[];
  tagSlugs: string[];
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  average: number;
}
