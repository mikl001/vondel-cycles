/**
 * Generates supabase/seed.sql plus brand-styled product images from the
 * hand-authored catalog in scripts/seed-data/catalog.ts.
 *
 * Deterministic by design: UUIDs are derived from content keys and all
 * randomness uses a fixed-seed PRNG, so re-runs produce identical output.
 *
 * Usage:
 *   npx tsx scripts/generate-seed.ts            # writes seed.sql + image files
 *   npx tsx scripts/generate-seed.ts --upload   # also uploads images to Storage
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  attributes,
  categories,
  COLOR_HEX,
  products,
  reviewAuthors,
  reviewTemplates,
  tags,
  type LocalizedText,
  type ProductDef,
} from "./seed-data/catalog";

const OUT_SQL = join(import.meta.dirname, "..", "supabase", "seed.sql");
const OUT_IMAGES = join(import.meta.dirname, ".generated", "images");

// Fixed reference date so ordering by "newest" is stable across runs.
const BASE_DATE_MS = Date.UTC(2026, 5, 1);

// ─── Determinism helpers ─────────────────────────────────────────────────────

/** uuid-v5-style: sha1 of a namespaced key, formatted as a UUID. */
function uuidFor(kind: string, key: string): string {
  const h = createHash("sha1").update(`vondel:${kind}:${key}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "5" + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(19980412);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) =>
  min + Math.floor(rand() * (max - min + 1));

// ─── SQL helpers ─────────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/'/g, "''");
const lit = (s: string) => `'${esc(s)}'`;
const jsonb = (v: unknown) => `${lit(JSON.stringify(v))}::jsonb`;
const tsAt = (offsetDays: number) =>
  `'${new Date(BASE_DATE_MS - offsetDays * 86_400_000).toISOString()}'`;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Derived content ─────────────────────────────────────────────────────────

const attrValueId = new Map<string, string>(); // "attr:value" -> uuid
for (const attr of attributes) {
  for (const v of attr.values) {
    attrValueId.set(`${attr.slug}:${v.slug}`, uuidFor("attrval", `${attr.slug}:${v.slug}`));
  }
}
const attrBySlug = new Map(attributes.map((a) => [a.slug, a]));

function exclCents(inclEuros: number, vatRate: number): number {
  return Math.round((inclEuros * 100) / (1 + vatRate / 100));
}

/** intro + a generated paragraph from the structured attributes */
function buildDescription(p: ProductDef): LocalizedText {
  const bits: { nl: string[]; en: string[] } = { nl: [], en: [] };
  for (const [slug, values] of Object.entries(p.attrs)) {
    const attr = attrBySlug.get(slug);
    if (!attr) continue;
    for (const vs of values) {
      const val = attr.values.find((v) => v.slug === vs);
      if (!val) continue;
      bits.nl.push(`${attr.name.nl.toLowerCase()}: ${val.label.nl}`);
      bits.en.push(`${attr.name.en.toLowerCase()}: ${val.label.en}`);
    }
  }
  const specsNl = bits.nl.length ? ` Specificaties — ${bits.nl.join(", ")}.` : "";
  const specsEn = bits.en.length ? ` Specifications — ${bits.en.join(", ")}.` : "";
  return {
    nl: `${p.intro.nl}${specsNl} Geleverd met twee jaar Vondel-garantie en gratis eerste servicebeurt in onze werkplaats aan het Vondelpark.`,
    en: `${p.intro.en}${specsEn} Comes with a two-year Vondel warranty and a free first service in our workshop next to the Vondelpark.`,
  };
}

function buildSpecs(p: ProductDef) {
  const specs: { label: LocalizedText; value: LocalizedText }[] = [];
  specs.push({
    label: { nl: "Merk", en: "Brand" },
    value: { nl: p.brand, en: p.brand },
  });
  for (const [slug, values] of Object.entries(p.attrs)) {
    const attr = attrBySlug.get(slug);
    if (!attr) continue;
    const labels = values
      .map((vs) => attr.values.find((v) => v.slug === vs))
      .filter(Boolean) as { label: LocalizedText }[];
    if (!labels.length) continue;
    specs.push({
      label: attr.name,
      value: {
        nl: labels.map((l) => l.label.nl).join(", "),
        en: labels.map((l) => l.label.en).join(", "),
      },
    });
  }
  if (p.weightGrams) {
    const kg = (p.weightGrams / 1000).toLocaleString("nl-NL", {
      maximumFractionDigits: 2,
    });
    specs.push({
      label: { nl: "Gewicht", en: "Weight" },
      value: { nl: `${kg} kg`, en: `${p.weightGrams / 1000} kg` },
    });
  }
  if (p.specsExtra) specs.push(...p.specsExtra);
  return specs;
}

interface VariantRow {
  id: string;
  sku: string;
  options: Record<string, { value: string; label: LocalizedText }>;
  priceCents: number | null;
  stock: number;
  sort: number;
}

function buildVariants(p: ProductDef, vatRate: number): VariantRow[] {
  const kleurAttr = attrBySlug.get("kleur")!;
  const colors: (string | null)[] = p.colors?.length ? p.colors : [null];
  const sizes: (string | null)[] = p.sizes?.length ? p.sizes : [null];
  const rows: VariantRow[] = [];
  let sort = 0;
  for (const color of colors) {
    for (const size of sizes) {
      const options: VariantRow["options"] = {};
      if (color) {
        const label = kleurAttr.values.find((v) => v.slug === color)!.label;
        options.kleur = { value: color, label };
      }
      if (size) {
        options.maat = {
          value: slugify(size),
          label: { nl: size, en: size },
        };
      }
      // Locks get longer-chain price steps to demo variant price overrides
      const sizeIdx = size ? sizes.indexOf(size) : 0;
      const priceCents =
        p.category === "sloten" && sizeIdx > 0
          ? exclCents(p.inclEuros, vatRate) + sizeIdx * 700
          : null;
      const skuBits = [p.key, color, size ? slugify(size) : null]
        .filter(Boolean)
        .join("-");
      rows.push({
        id: uuidFor("variant", skuBits),
        sku: `VC-${skuBits.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`,
        options,
        priceCents,
        // ~8% of variants out of stock to demo stock badges
        stock: rand() < 0.08 ? 0 : randInt(2, 28),
        sort: sort++,
      });
    }
  }
  return rows;
}

// ─── SVG image generation ────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, string> = {
  // simple geometric silhouettes, stroke-based, in a 200x150 viewBox
  bike: `<g fill="none" stroke="#STROKE" stroke-width="7" stroke-linecap="round">
    <circle cx="50" cy="105" r="32"/><circle cx="150" cy="105" r="32"/>
    <path d="M50 105 80 45h42M150 105 126 45h-12M80 45 50 105m30-60 38 60H50"/>
    <path d="M118 38h22"/></g>`,
  helm: `<g fill="none" stroke="#STROKE" stroke-width="7" stroke-linecap="round">
    <path d="M40 95a60 52 0 0 1 120 0l-8 18H48z"/>
    <path d="M70 50v55M100 43v62M130 50v55"/><path d="M88 122h40l-8 14h-26z"/></g>`,
  slot: `<g fill="none" stroke="#STROKE" stroke-width="8" stroke-linecap="round">
    <rect x="55" y="70" width="90" height="62" rx="10"/>
    <path d="M72 70V52a28 28 0 0 1 56 0v18"/><circle cx="100" cy="98" r="9"/>
    <path d="M100 107v12"/></g>`,
  licht: `<g fill="none" stroke="#STROKE" stroke-width="7" stroke-linecap="round">
    <circle cx="92" cy="85" r="30"/><circle cx="92" cy="85" r="13"/>
    <path d="M134 60l22-14M138 85h28M134 110l22 14"/></g>`,
  tas: `<g fill="none" stroke="#STROKE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 60h100l-8 78H58z"/><path d="M72 60V46a28 18 0 0 1 56 0v14"/>
    <path d="M58 96h84"/></g>`,
  onderdeel: `<g fill="none" stroke="#STROKE" stroke-width="7" stroke-linecap="round">
    <circle cx="100" cy="88" r="26"/><circle cx="100" cy="88" r="9"/>
    <path d="M100 50v-14M100 126v14M138 88h14M48 88h14M127 61l10-10M63 115l10-10M127 115l10 10M63 61 73 71"/></g>`,
  boek: `<g fill="none" stroke="#STROKE" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M100 52c-14-10-34-12-48-8v84c14-4 34-2 48 8 14-10 34-12 48-8V44c-14-4-34-2-48 8z"/>
    <path d="M100 52v84"/></g>`,
};

function iconFor(categoryKey: string): string {
  if (["stadsfietsen", "e-bikes", "racefietsen", "kinderfietsen"].includes(categoryKey)) return CATEGORY_ICON.bike;
  if (categoryKey === "helmen") return CATEGORY_ICON.helm;
  if (categoryKey === "sloten") return CATEGORY_ICON.slot;
  if (categoryKey === "verlichting") return CATEGORY_ICON.licht;
  if (categoryKey === "fietstassen") return CATEGORY_ICON.tas;
  if (categoryKey === "boeken-kaarten") return CATEGORY_ICON.boek;
  return CATEGORY_ICON.onderdeel;
}

function mixWithWhite(hex: string, ratio: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 0xff;
    return Math.round(c + (255 - c) * ratio);
  };
  return `#${[ch(16), ch(8), ch(0)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function xmlEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function productSvg(p: ProductDef, color: string | null): string {
  const hex = color ? COLOR_HEX[color] : "#346748";
  const bg = mixWithWhite(hex, 0.86);
  const bg2 = mixWithWhite(hex, 0.72);
  const icon = iconFor(p.category).replaceAll("#STROKE", hex);
  const title = xmlEsc(p.name.nl);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg2}"/>
  </linearGradient></defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <g transform="translate(400,210) scale(2)">${icon}</g>
  <text x="600" y="710" text-anchor="middle" font-family="Georgia, serif" font-size="52" fill="#1d3728">${title}</text>
  <text x="600" y="768" text-anchor="middle" font-family="Verdana, sans-serif" font-size="26" letter-spacing="6" fill="#346748">${xmlEsc(p.brand.toUpperCase())} — DEMO</text>
  ${color ? `<circle cx="600" cy="826" r="16" fill="${hex}" stroke="#ffffff" stroke-width="4"/>` : ""}
</svg>`;
}

// ─── Build SQL ───────────────────────────────────────────────────────────────

const sql: string[] = [
  "-- Generated by scripts/generate-seed.ts — do not edit by hand.",
  "-- Deterministic: re-running the generator produces identical output.",
  "begin;",
];

// Categories (parents before children)
const catId = new Map(categories.map((c) => [c.key, uuidFor("category", c.key)]));
for (const c of [...categories].sort((a, b) => Number(!!a.parent) - Number(!!b.parent))) {
  sql.push(
    `insert into public.categories (id, parent_id, slug, name, description, sort_order) values (` +
      `'${catId.get(c.key)}', ${c.parent ? `'${catId.get(c.parent)}'` : "null"}, ` +
      `${jsonb(c.slug)}, ${jsonb(c.name)}, ${jsonb(c.description)}, ${c.sort});`,
  );
}

// Attributes + values
for (const a of attributes) {
  const aId = uuidFor("attribute", a.slug);
  sql.push(
    `insert into public.attributes (id, slug, name, sort_order) values ('${aId}', ${lit(a.slug)}, ${jsonb(a.name)}, ${a.sort});`,
  );
  a.values.forEach((v, i) => {
    sql.push(
      `insert into public.attribute_values (id, attribute_id, slug, label, sort_order) values (` +
        `'${attrValueId.get(`${a.slug}:${v.slug}`)}', '${aId}', ${lit(v.slug)}, ${jsonb(v.label)}, ${i});`,
    );
  });
}

// Tags
const tagId = new Map(tags.map((t) => [t.slug, uuidFor("tag", t.slug)]));
for (const t of tags) {
  sql.push(
    `insert into public.tags (id, slug, name) values ('${tagId.get(t.slug)}', ${lit(t.slug)}, ${jsonb(t.name)});`,
  );
}

// Products + variants + images + facet links + tags
interface ImageJob {
  path: string;
  svg: string;
}
const imageJobs: ImageJob[] = [];
const productIds = new Map<string, string>();

for (const p of products) {
  const id = uuidFor("product", p.key);
  productIds.set(p.key, id);
  const vat = p.vatRate ?? 21;
  const slug = { nl: slugify(p.name.nl), en: slugify(p.name.en) };
  const createdDaysAgo = randInt(5, 540);

  sql.push(
    `insert into public.products (id, category_id, slug, name, description, specs, brand, vat_rate, base_price_cents, status, created_at) values (` +
      `'${id}', '${catId.get(p.category)}', ${jsonb(slug)}, ${jsonb(p.name)}, ` +
      `${jsonb(buildDescription(p))}, ${jsonb(buildSpecs(p))}, ${lit(p.brand)}, ` +
      `${vat}, ${exclCents(p.inclEuros, vat)}, 'active', ${tsAt(createdDaysAgo)});`,
  );

  for (const v of buildVariants(p, vat)) {
    sql.push(
      `insert into public.product_variants (id, product_id, sku, options, price_cents, stock_quantity, weight_grams, sort_order) values (` +
        `'${v.id}', '${id}', ${lit(v.sku)}, ${jsonb(v.options)}, ` +
        `${v.priceCents ?? "null"}, ${v.stock}, ${p.weightGrams ?? "null"}, ${v.sort});`,
    );
  }

  const colors = p.colors?.length ? p.colors : [null];
  colors.forEach((color, i) => {
    // DB rows point at the .webp files the uploader produces
    const storagePath = `products/${p.key}/${color ?? "default"}.webp`;
    imageJobs.push({ path: storagePath, svg: productSvg(p, color) });
    const kleurLabel = color
      ? attrBySlug.get("kleur")!.values.find((v) => v.slug === color)!.label
      : null;
    const alt = {
      nl: kleurLabel ? `${p.name.nl} — ${kleurLabel.nl.toLowerCase()}` : p.name.nl,
      en: kleurLabel ? `${p.name.en} — ${kleurLabel.en.toLowerCase()}` : p.name.en,
    };
    sql.push(
      `insert into public.product_images (id, product_id, storage_path, alt, sort_order) values (` +
        `'${uuidFor("image", storagePath)}', '${id}', ${lit(storagePath)}, ${jsonb(alt)}, ${i});`,
    );
  });

  // Facet links: declared attributes + colours derived from variants
  const facetPairs = new Set<string>();
  for (const [slug2, values] of Object.entries(p.attrs)) {
    for (const v of values) facetPairs.add(`${slug2}:${v}`);
  }
  for (const c of p.colors ?? []) facetPairs.add(`kleur:${c}`);
  for (const pair of facetPairs) {
    const valId = attrValueId.get(pair);
    if (!valId) throw new Error(`Unknown attribute value: ${pair} (product ${p.key})`);
    sql.push(
      `insert into public.product_attribute_values (product_id, attribute_value_id) values ('${id}', '${valId}');`,
    );
  }

  for (const t of p.tags ?? []) {
    sql.push(
      `insert into public.product_tags (product_id, tag_id) values ('${id}', '${tagId.get(t)}');`,
    );
  }
}

// Related products: same-category "related" + cross-sell from bikes to accessories
const byCategory = new Map<string, ProductDef[]>();
for (const p of products) {
  byCategory.set(p.category, [...(byCategory.get(p.category) ?? []), p]);
}
const crossSellPool = products.filter((p) =>
  ["helmen", "sloten", "verlichting", "fietstassen"].includes(p.category),
);
const bikeCategories = ["stadsfietsen", "e-bikes", "racefietsen", "kinderfietsen"];

for (const p of products) {
  const id = productIds.get(p.key)!;
  const seen = new Set<string>([p.key]);
  const add = (other: ProductDef, type: string) => {
    if (seen.has(other.key)) return;
    seen.add(other.key);
    sql.push(
      `insert into public.related_products (product_id, related_id, relation_type) values ('${id}', '${productIds.get(other.key)}', '${type}');`,
    );
  };
  const siblings = (byCategory.get(p.category) ?? []).filter((s) => s.key !== p.key);
  for (let i = 0; i < Math.min(3, siblings.length); i++) add(pick(siblings), "related");
  if (bikeCategories.includes(p.category)) {
    for (let i = 0; i < 3; i++) add(pick(crossSellPool), "cross_sell");
    // upsell: pricier product in same category, if any
    const pricier = siblings.filter((s) => s.inclEuros > p.inclEuros * 1.2);
    if (pricier.length) add(pick(pricier), "upsell");
  }
}

// Reviews: ~150 demo reviews, weighted toward positive
const ratingPool = [5, 5, 5, 5, 5, 4, 4, 4, 3, 2];
for (let i = 0; i < 150; i++) {
  const p = pick(products);
  const rating = pick(ratingPool);
  const tpl = pick(reviewTemplates[rating]);
  const author = pick(reviewAuthors);
  sql.push(
    `insert into public.reviews (id, product_id, author_name, rating, title, body, is_demo, status, created_at) values (` +
      `'${uuidFor("review", `${p.key}:${i}`)}', '${productIds.get(p.key)}', ${lit(author)}, ${rating}, ` +
      `${lit(pick([tpl.title.nl, tpl.title.en]))}, ${lit(rand() < 0.7 ? tpl.body.nl : tpl.body.en)}, ` +
      `true, 'approved', ${tsAt(randInt(1, 400))});`,
  );
}

sql.push("commit;");

// ─── Write outputs ───────────────────────────────────────────────────────────

writeFileSync(OUT_SQL, sql.join("\n") + "\n", "utf8");
console.log(`seed.sql written: ${sql.length} statements -> ${OUT_SQL}`);

mkdirSync(OUT_IMAGES, { recursive: true });
for (const job of imageJobs) {
  const filePath = join(OUT_IMAGES, job.path.replaceAll("/", "_"));
  writeFileSync(filePath.replace(/\.webp$/, ".svg"), job.svg, "utf8");
}
console.log(`${imageJobs.length} SVG images written to ${OUT_IMAGES}`);

// ─── Optional: rasterize + upload to Supabase Storage ────────────────────────

async function uploadImages() {
  const { createClient } = await import("@supabase/supabase-js");
  const sharp = (await import("sharp")).default;

  try {
    process.loadEnvFile(".env.local");
  } catch {
    // fall back to already-set env vars
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  let uploaded = 0;
  for (const job of imageJobs) {
    const webp = await sharp(Buffer.from(job.svg)).webp({ quality: 82 }).toBuffer();
    const { error } = await supabase.storage
      .from("product-images")
      .upload(job.path, webp, { contentType: "image/webp", upsert: true });
    if (error) throw new Error(`Upload failed for ${job.path}: ${error.message}`);
    uploaded++;
    if (uploaded % 25 === 0) console.log(`  uploaded ${uploaded}/${imageJobs.length}`);
  }
  console.log(`Uploaded ${uploaded} images to product-images bucket`);
}

if (process.argv.includes("--upload")) {
  uploadImages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
