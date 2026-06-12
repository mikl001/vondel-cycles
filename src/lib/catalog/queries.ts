import { createStaticClient } from "@/lib/supabase/static";
import type {
  CategoryNode,
  LocalizedText,
  ProductDetail,
  Review,
  ReviewSummary,
} from "@/types/catalog";
import type { Database, Json } from "@/types/database.types";

type FilterProductsRow =
  Database["public"]["Functions"]["filter_products"]["Returns"][number];
type FacetCountRow =
  Database["public"]["Functions"]["facet_counts"]["Returns"][number];

export type SortOption = "newest" | "price_asc" | "price_desc" | "name" | "relevance";

export interface CatalogFilters {
  categoryIds?: string[];
  attrs?: Record<string, string[]>;
  priceMinCents?: number;
  priceMaxCents?: number;
  inStockOnly?: boolean;
  search?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: FilterProductsRow[];
  total: number;
  page: number;
  pageCount: number;
}

const DEFAULT_PAGE_SIZE = 24;

/**
 * Catalog reads tolerate an unreachable database (e.g. CI builds without
 * Supabase running) by returning empty results instead of failing the build.
 */
async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("[catalog] query failed:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  return safe([], async () => {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, parent_id, slug, name, description, sort_order")
      .order("sort_order");
    if (error) throw error;

    const nodes = new Map<string, CategoryNode>(
      data.map((c) => [
        c.id,
        {
          id: c.id,
          parentId: c.parent_id,
          slug: c.slug as LocalizedText,
          name: c.name as LocalizedText,
          description: c.description as LocalizedText | null,
          sortOrder: c.sort_order,
          children: [],
        },
      ]),
    );
    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) {
        nodes.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  });
}

/** Resolve a category by its slug in either locale (locale switch friendly). */
export function findCategoryBySlug(
  tree: CategoryNode[],
  slugPath: string[],
): { category: CategoryNode; trail: CategoryNode[] } | null {
  let level = tree;
  const trail: CategoryNode[] = [];
  for (const part of slugPath) {
    const match = level.find((c) => c.slug.nl === part || c.slug.en === part);
    if (!match) return null;
    trail.push(match);
    level = match.children;
  }
  const category = trail[trail.length - 1];
  return category ? { category, trail } : null;
}

/** Category plus all descendant ids (for products in parent categories). */
export function categoryScopeIds(category: CategoryNode): string[] {
  const ids: string[] = [];
  const walk = (node: CategoryNode) => {
    ids.push(node.id);
    node.children.forEach(walk);
  };
  walk(category);
  return ids;
}

export async function listProducts(
  filters: CatalogFilters,
): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  return safe({ items: [], total: 0, page, pageCount: 0 }, async () => {
    const supabase = createStaticClient();
    const { data, error } = await supabase.rpc("filter_products", {
      p_category_ids: filters.categoryIds ?? null,
      p_attr_filters: (filters.attrs ?? {}) as Json,
      p_price_min: filters.priceMinCents ?? null,
      p_price_max: filters.priceMaxCents ?? null,
      p_in_stock: filters.inStockOnly ?? false,
      p_search: filters.search ?? null,
      p_sort: filters.sort ?? (filters.search ? "relevance" : "newest"),
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize,
    });
    if (error) throw error;
    const total = data[0]?.total_count ?? 0;
    return { items: data, total, page, pageCount: Math.ceil(total / pageSize) };
  });
}

export async function getFacetCounts(
  filters: CatalogFilters,
): Promise<FacetCountRow[]> {
  return safe([], async () => {
    const supabase = createStaticClient();
    const { data, error } = await supabase.rpc("facet_counts", {
      p_category_ids: filters.categoryIds ?? null,
      p_attr_filters: (filters.attrs ?? {}) as Json,
      p_price_min: filters.priceMinCents ?? null,
      p_price_max: filters.priceMaxCents ?? null,
      p_in_stock: filters.inStockOnly ?? false,
      p_search: filters.search ?? null,
    });
    if (error) throw error;
    return data;
  });
}

export async function getPriceRange(
  categoryIds?: string[],
): Promise<{ min: number; max: number } | null> {
  return safe(null, async () => {
    const supabase = createStaticClient();
    const { data, error } = await supabase.rpc("price_range", {
      p_category_ids: categoryIds ?? null,
    });
    if (error) throw error;
    const row = data[0];
    return row?.min_incl_cents != null
      ? { min: row.min_incl_cents, max: row.max_incl_cents }
      : null;
  });
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  return safe(null, async () => {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, category_id, slug, name, description, specs, brand, vat_rate, base_price_cents,
         product_variants (id, sku, options, price_cents, stock_quantity, low_stock_threshold, sort_order),
         product_images (storage_path, alt, sort_order),
         product_tags (tags (slug))`,
      )
      .or(`slug->>nl.eq.${slug},slug->>en.eq.${slug}`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    // The hand-written Database type has no Relationships metadata, so
    // supabase-js cannot infer nested selects — cast the embedded shape once.
    const row = data as unknown as {
      id: string;
      category_id: string;
      slug: LocalizedText;
      name: LocalizedText;
      description: LocalizedText | null;
      specs: ProductDetail["specs"] | null;
      brand: string;
      vat_rate: number;
      base_price_cents: number;
      product_variants: {
        id: string;
        sku: string;
        options: ProductDetail["variants"][number]["options"] | null;
        price_cents: number | null;
        stock_quantity: number;
        low_stock_threshold: number;
        sort_order: number;
      }[];
      product_images: {
        storage_path: string;
        alt: LocalizedText | null;
        sort_order: number;
      }[];
      product_tags: { tags: { slug: string } | null }[];
    };

    return {
      id: row.id,
      categoryId: row.category_id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      specs: row.specs ?? [],
      brand: row.brand,
      vatRate: row.vat_rate,
      basePriceCents: row.base_price_cents,
      variants: [...row.product_variants]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          options: v.options ?? {},
          priceCents: v.price_cents,
          stockQuantity: v.stock_quantity,
          lowStockThreshold: v.low_stock_threshold,
        })),
      images: [...row.product_images]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => ({
          storagePath: i.storage_path,
          alt: i.alt,
          sortOrder: i.sort_order,
        })),
      tagSlugs: row.product_tags
        .map((pt) => pt.tags?.slug)
        .filter((s): s is string => !!s),
    };
  });
}

export type ProductCardRow =
  Database["public"]["Functions"]["product_cards"]["Returns"][number];

export async function getRelatedProducts(
  productId: string,
  types: string[] = ["related", "cross_sell", "upsell"],
): Promise<ProductCardRow[]> {
  return safe([], async () => {
    const supabase = createStaticClient();
    const { data: rel, error } = await supabase
      .from("related_products")
      .select("related_id, relation_type")
      .eq("product_id", productId)
      .in("relation_type", types);
    if (error) throw error;
    if (!rel.length) return [];

    const { data, error: err2 } = await supabase.rpc("product_cards", {
      p_ids: rel.map((r) => r.related_id),
    });
    if (err2) throw err2;
    return data.slice(0, 8);
  });
}

export async function getProductReviews(
  productId: string,
  limit = 10,
): Promise<{ reviews: Review[]; summary: ReviewSummary }> {
  return safe({ reviews: [], summary: { count: 0, average: 0 } }, async () => {
    const supabase = createStaticClient();
    const { data, error, count } = await supabase
      .from("reviews")
      .select("id, author_name, rating, title, body, is_demo, created_at", {
        count: "exact",
      })
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const { data: all, error: err2 } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("status", "approved");
    if (err2) throw err2;
    const average = all.length
      ? all.reduce((sum, r) => sum + r.rating, 0) / all.length
      : 0;

    return {
      reviews: data.map((r) => ({
        id: r.id,
        authorName: r.author_name,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isDemo: r.is_demo,
        createdAt: r.created_at,
      })),
      summary: { count: count ?? all.length, average },
    };
  });
}

/** Cards for products carrying a tag (homepage rails). */
export async function getProductsByTag(
  tagSlug: string,
  limit = 8,
): Promise<ProductCardRow[]> {
  return safe([], async () => {
    const supabase = createStaticClient();
    const { data: links, error } = await supabase
      .from("product_tags")
      .select("product_id, tags!inner(slug)")
      .eq("tags.slug", tagSlug)
      .limit(limit);
    if (error) throw error;
    if (!links.length) return [];
    const { data, error: err2 } = await supabase.rpc("product_cards", {
      p_ids: links.map((l) => l.product_id),
    });
    if (err2) throw err2;
    return data;
  });
}

/** All product slugs for generateStaticParams (both locales). */
export async function getAllProductSlugs(): Promise<LocalizedText[]> {
  return safe([], async () => {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug")
      .eq("status", "active");
    if (error) throw error;
    return data.map((p) => p.slug as LocalizedText);
  });
}
