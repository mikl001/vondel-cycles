-- Catalog querying: faceted filtering, facet counts, typo-tolerant search
-- and autosuggestions. All functions are STABLE and respect product status;
-- they are callable by anon (read-only over public catalog data).

-- Consumer price incl. BTW, computed from the stored excl-BTW amount.
create or replace function public.price_incl_cents(excl integer, vat integer)
returns integer
language sql
immutable
as $$
  select round(excl * (1 + vat / 100.0))::integer;
$$;

-- ---------------------------------------------------------------------------
-- filter_products: one entry point for category listings and search results.
-- p_attr_filters example: {"kleur": ["zwart", "rood"], "materiaal": ["staal"]}
-- Semantics: AND across attributes, OR within one attribute's values.
-- ---------------------------------------------------------------------------

create or replace function public.filter_products(
  p_category_ids uuid[] default null,
  p_attr_filters jsonb default '{}'::jsonb,
  p_price_min integer default null,
  p_price_max integer default null,
  p_in_stock boolean default false,
  p_search text default null,
  p_sort text default 'newest',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  slug jsonb,
  name jsonb,
  brand text,
  vat_rate integer,
  base_price_cents integer,
  price_incl_cents integer,
  image_path text,
  in_stock boolean,
  tag_slugs text[],
  created_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  with filtered as (
    select p.*,
      case
        when p_search is null then 0
        else greatest(
          ts_rank(p.search_vector, websearch_to_tsquery('dutch', p_search)),
          ts_rank(p.search_vector, websearch_to_tsquery('english', p_search)),
          similarity(p.search_text, p_search)
        )
      end as rank
    from public.products p
    where p.status = 'active'
      and (p_category_ids is null or p.category_id = any (p_category_ids))
      and (p_price_min is null or public.price_incl_cents(p.base_price_cents, p.vat_rate) >= p_price_min)
      and (p_price_max is null or public.price_incl_cents(p.base_price_cents, p.vat_rate) <= p_price_max)
      and (
        not p_in_stock
        or exists (
          select 1 from public.product_variants v
          where v.product_id = p.id and v.stock_quantity > 0
        )
      )
      and (
        p_search is null
        or p.search_vector @@ websearch_to_tsquery('dutch', p_search)
        or p.search_vector @@ websearch_to_tsquery('english', p_search)
        or similarity(p.search_text, p_search) > 0.2
      )
      and not exists (
        select 1
        from jsonb_each(coalesce(p_attr_filters, '{}'::jsonb)) as f(attr_slug, vals)
        where not exists (
          select 1
          from public.product_attribute_values pav
          join public.attribute_values av on av.id = pav.attribute_value_id
          join public.attributes a on a.id = av.attribute_id
          where pav.product_id = p.id
            and a.slug = f.attr_slug
            and av.slug in (select jsonb_array_elements_text(f.vals))
        )
      )
  )
  select
    f.id,
    f.slug,
    f.name,
    f.brand,
    f.vat_rate,
    f.base_price_cents,
    public.price_incl_cents(f.base_price_cents, f.vat_rate) as price_incl_cents,
    (
      select pi.storage_path from public.product_images pi
      where pi.product_id = f.id
      order by pi.sort_order
      limit 1
    ) as image_path,
    exists (
      select 1 from public.product_variants v
      where v.product_id = f.id and v.stock_quantity > 0
    ) as in_stock,
    coalesce(
      (
        select array_agg(t.slug order by t.slug)
        from public.product_tags pt
        join public.tags t on t.id = pt.tag_id
        where pt.product_id = f.id
      ),
      '{}'::text[]
    ) as tag_slugs,
    f.created_at,
    count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'price_asc' then public.price_incl_cents(f.base_price_cents, f.vat_rate) end asc nulls last,
    case when p_sort = 'price_desc' then public.price_incl_cents(f.base_price_cents, f.vat_rate) end desc nulls last,
    case when p_sort = 'relevance' then f.rank end desc nulls last,
    case when p_sort = 'name' then f.name->>'nl' end asc nulls last,
    f.created_at desc,
    f.id desc
  limit p_limit offset p_offset;
$$;

-- ---------------------------------------------------------------------------
-- facet_counts: counts per attribute value for the current filter context.
-- Each attribute excludes its OWN filter so multi-select shows what adding
-- another value of the same attribute would yield.
-- ---------------------------------------------------------------------------

create or replace function public.facet_counts(
  p_category_ids uuid[] default null,
  p_attr_filters jsonb default '{}'::jsonb,
  p_price_min integer default null,
  p_price_max integer default null,
  p_in_stock boolean default false,
  p_search text default null
)
returns table (
  attribute_slug text,
  attribute_name jsonb,
  attribute_sort integer,
  value_slug text,
  value_label jsonb,
  value_sort integer,
  product_count bigint
)
language sql
stable
as $$
  select
    a.slug,
    a.name,
    a.sort_order,
    av.slug,
    av.label,
    av.sort_order,
    count(distinct p.id)
  from public.attributes a
  join public.attribute_values av on av.attribute_id = a.id
  join public.product_attribute_values pav on pav.attribute_value_id = av.id
  join public.products p on p.id = pav.product_id
  where p.status = 'active'
    and (p_category_ids is null or p.category_id = any (p_category_ids))
    and (p_price_min is null or public.price_incl_cents(p.base_price_cents, p.vat_rate) >= p_price_min)
    and (p_price_max is null or public.price_incl_cents(p.base_price_cents, p.vat_rate) <= p_price_max)
    and (
      not p_in_stock
      or exists (
        select 1 from public.product_variants v
        where v.product_id = p.id and v.stock_quantity > 0
      )
    )
    and (
      p_search is null
      or p.search_vector @@ websearch_to_tsquery('dutch', p_search)
      or p.search_vector @@ websearch_to_tsquery('english', p_search)
      or similarity(p.search_text, p_search) > 0.2
    )
    and not exists (
      select 1
      from jsonb_each(coalesce(p_attr_filters, '{}'::jsonb)) as f(attr_slug, vals)
      where f.attr_slug <> a.slug
        and not exists (
          select 1
          from public.product_attribute_values pav2
          join public.attribute_values av2 on av2.id = pav2.attribute_value_id
          join public.attributes a2 on a2.id = av2.attribute_id
          where pav2.product_id = p.id
            and a2.slug = f.attr_slug
            and av2.slug in (select jsonb_array_elements_text(f.vals))
        )
    )
  group by a.slug, a.name, a.sort_order, av.slug, av.label, av.sort_order
  order by a.sort_order, av.sort_order;
$$;

-- ---------------------------------------------------------------------------
-- price_range: incl-BTW price bounds for a category scope (price slider).
-- ---------------------------------------------------------------------------

create or replace function public.price_range(p_category_ids uuid[] default null)
returns table (min_incl_cents integer, max_incl_cents integer)
language sql
stable
as $$
  select
    min(public.price_incl_cents(p.base_price_cents, p.vat_rate)),
    max(public.price_incl_cents(p.base_price_cents, p.vat_rate))
  from public.products p
  where p.status = 'active'
    and (p_category_ids is null or p.category_id = any (p_category_ids));
$$;

-- ---------------------------------------------------------------------------
-- product_cards: card data for an explicit id list (related/cross-sell rails).
-- ---------------------------------------------------------------------------

create or replace function public.product_cards(p_ids uuid[])
returns table (
  id uuid,
  slug jsonb,
  name jsonb,
  brand text,
  vat_rate integer,
  base_price_cents integer,
  price_incl_cents integer,
  image_path text,
  in_stock boolean,
  tag_slugs text[]
)
language sql
stable
as $$
  select
    p.id,
    p.slug,
    p.name,
    p.brand,
    p.vat_rate,
    p.base_price_cents,
    public.price_incl_cents(p.base_price_cents, p.vat_rate),
    (
      select pi.storage_path from public.product_images pi
      where pi.product_id = p.id
      order by pi.sort_order
      limit 1
    ),
    exists (
      select 1 from public.product_variants v
      where v.product_id = p.id and v.stock_quantity > 0
    ),
    coalesce(
      (
        select array_agg(t.slug order by t.slug)
        from public.product_tags pt
        join public.tags t on t.id = pt.tag_id
        where pt.product_id = p.id
      ),
      '{}'::text[]
    )
  from public.products p
  where p.id = any (p_ids) and p.status = 'active'
  order by array_position(p_ids, p.id);
$$;

-- ---------------------------------------------------------------------------
-- search_suggestions: typo-tolerant autocomplete for the search box.
-- ---------------------------------------------------------------------------

create or replace function public.search_suggestions(
  p_query text,
  p_locale text default 'nl',
  p_limit integer default 6
)
returns table (
  product_id uuid,
  suggestion text,
  slug text,
  price_incl_cents integer,
  image_path text
)
language sql
stable
as $$
  select
    p.id,
    p.name->>p_locale,
    p.slug->>p_locale,
    public.price_incl_cents(p.base_price_cents, p.vat_rate),
    (
      select pi.storage_path from public.product_images pi
      where pi.product_id = p.id
      order by pi.sort_order
      limit 1
    )
  from public.products p
  where p.status = 'active'
    and (
      p.search_vector @@ websearch_to_tsquery('dutch', p_query)
      or p.search_vector @@ websearch_to_tsquery('english', p_query)
      or similarity(p.search_text, p_query) > 0.15
      or p.search_text ilike '%' || p_query || '%'
    )
  order by
    greatest(
      ts_rank(p.search_vector, websearch_to_tsquery('dutch', p_query)),
      ts_rank(p.search_vector, websearch_to_tsquery('english', p_query)),
      similarity(p.search_text, p_query)
    ) desc
  limit p_limit;
$$;
