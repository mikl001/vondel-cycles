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
        abandoned_notified_at: string | null;
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
      shipping_methods: Table<{
        id: string;
        code: string;
        name: Json;
        description: Json | null;
        price_cents: number;
        free_above_cents: number | null;
        supports_pickup: boolean;
        sort_order: number;
        active: boolean;
      }>;
      promo_codes: Table<{
        id: string;
        code: string;
        discount_type: string;
        value: number;
        min_order_cents: number;
        valid_from: string | null;
        valid_until: string | null;
        max_uses: number | null;
        use_count: number;
        active: boolean;
      }>;
      orders: Table<{
        id: string;
        order_number: string;
        user_id: string | null;
        cart_id: string | null;
        email: string;
        confirmation_token: string;
        status: string;
        payment_id: string | null;
        payment_provider: string;
        locale: string;
        customer_type: string;
        company_name: string | null;
        vat_number: string | null;
        reverse_charge: boolean;
        shipping_address: Json;
        billing_address: Json;
        shipping_method_code: string;
        shipping_cost_cents: number;
        pickup_point: Json | null;
        promo_code: string | null;
        promo_discount_cents: number;
        subtotal_excl_cents: number;
        vat_breakdown: Json;
        total_incl_cents: number;
        tracking_code: string | null;
        created_at: string;
        updated_at: string;
      }>;
      order_items: Table<{
        id: string;
        order_id: string;
        variant_id: string | null;
        product_name: Json;
        product_slug: Json | null;
        sku: string;
        options: Json;
        image_path: string | null;
        unit_price_excl_cents: number;
        vat_rate: number;
        quantity: number;
      }>;
      order_events: Table<{
        id: string;
        order_id: string;
        event_type: string;
        payload: Json | null;
        created_at: string;
      }>;
      profiles: Table<{
        id: string;
        full_name: string;
        phone: string | null;
        marketing_emails: boolean;
        analytics_consent: boolean;
        created_at: string;
        updated_at: string;
      }>;
      addresses: Table<{
        id: string;
        user_id: string;
        label: string;
        first_name: string;
        last_name: string;
        street: string;
        house_number: string;
        addition: string | null;
        postcode: string;
        city: string;
        country: string;
        is_default: boolean;
        created_at: string;
      }>;
      wishlists: Table<{
        user_id: string;
        product_id: string;
        created_at: string;
      }>;
      user_roles: Table<{
        user_id: string;
        role: string;
        created_at: string;
      }>;
      audit_log: Table<{
        id: string;
        actor_id: string | null;
        actor_email: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        diff: Json | null;
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
    Views: {
      admin_sales_per_day: {
        Row: {
          day: string;
          orders: number;
          revenue_cents: number;
          avg_order_cents: number;
        };
        Relationships: [];
      };
      admin_low_stock: {
        Row: {
          variant_id: string;
          sku: string;
          product_name: Json;
          stock_quantity: number;
          low_stock_threshold: number;
        };
        Relationships: [];
      };
    };
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
      next_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      decrement_stock: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
