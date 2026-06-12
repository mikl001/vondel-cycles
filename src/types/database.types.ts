// Hand-written to match supabase/migrations until local Docker is available;
// regenerate with `npm run db:types` (output shape is identical).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      categories: Table<{
        id: string;
        parent_id: string | null;
        slug: Json;
        name: Json;
        description: Json | null;
        sort_order: number;
        image_path: string | null;
        created_at: string;
      }>;
      products: Table<{
        id: string;
        category_id: string;
        slug: Json;
        name: Json;
        description: Json | null;
        specs: Json;
        brand: string;
        vat_rate: number;
        base_price_cents: number;
        status: string;
        search_text: string;
        search_vector: unknown;
        created_at: string;
        updated_at: string;
      }>;
      product_variants: Table<{
        id: string;
        product_id: string;
        sku: string;
        options: Json;
        price_cents: number | null;
        stock_quantity: number;
        low_stock_threshold: number;
        weight_grams: number | null;
        sort_order: number;
        created_at: string;
      }>;
      product_images: Table<{
        id: string;
        product_id: string;
        variant_id: string | null;
        storage_path: string;
        alt: Json | null;
        sort_order: number;
      }>;
      attributes: Table<{
        id: string;
        slug: string;
        name: Json;
        sort_order: number;
      }>;
      attribute_values: Table<{
        id: string;
        attribute_id: string;
        slug: string;
        label: Json;
        sort_order: number;
      }>;
      product_attribute_values: Table<{
        product_id: string;
        attribute_value_id: string;
      }>;
      tags: Table<{
        id: string;
        slug: string;
        name: Json;
      }>;
      product_tags: Table<{
        product_id: string;
        tag_id: string;
      }>;
      related_products: Table<{
        product_id: string;
        related_id: string;
        relation_type: string;
      }>;
      carts: Table<{
        id: string;
        user_id: string | null;
        anon_token: string | null;
        status: string;
        email: string | null;
        created_at: string;
        updated_at: string;
      }>;
      cart_items: Table<{
        id: string;
        cart_id: string;
        variant_id: string;
        quantity: number;
        created_at: string;
      }>;
      reviews: Table<{
        id: string;
        product_id: string;
        user_id: string | null;
        author_name: string;
        rating: number;
        title: string | null;
        body: string | null;
        is_demo: boolean;
        status: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      filter_products: {
        Args: {
          p_category_ids?: string[] | null;
          p_attr_filters?: Json;
          p_price_min?: number | null;
          p_price_max?: number | null;
          p_in_stock?: boolean;
          p_search?: string | null;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          slug: Json;
          name: Json;
          brand: string;
          vat_rate: number;
          base_price_cents: number;
          price_incl_cents: number;
          image_path: string | null;
          in_stock: boolean;
          tag_slugs: string[];
          created_at: string;
          total_count: number;
        }[];
      };
      facet_counts: {
        Args: {
          p_category_ids?: string[] | null;
          p_attr_filters?: Json;
          p_price_min?: number | null;
          p_price_max?: number | null;
          p_in_stock?: boolean;
          p_search?: string | null;
        };
        Returns: {
          attribute_slug: string;
          attribute_name: Json;
          attribute_sort: number;
          value_slug: string;
          value_label: Json;
          value_sort: number;
          product_count: number;
        }[];
      };
      price_range: {
        Args: { p_category_ids?: string[] | null };
        Returns: { min_incl_cents: number; max_incl_cents: number }[];
      };
      search_suggestions: {
        Args: { p_query: string; p_locale?: string; p_limit?: number };
        Returns: {
          product_id: string;
          suggestion: string;
          slug: string;
          price_incl_cents: number;
          image_path: string | null;
        }[];
      };
      product_cards: {
        Args: { p_ids: string[] };
        Returns: {
          id: string;
          slug: Json;
          name: Json;
          brand: string;
          vat_rate: number;
          base_price_cents: number;
          price_incl_cents: number;
          image_path: string | null;
          in_stock: boolean;
          tag_slugs: string[];
        }[];
      };
      price_incl_cents: {
        Args: { excl: number; vat: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
