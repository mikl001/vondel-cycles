import type { Locale } from "@/i18n/routing";
import type { LocalizedText } from "@/types/catalog";

/** Resolve a bilingual jsonb text for the active locale (nl fallback). */
export function lt(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] ?? text.nl ?? "";
}

/** Consumer price incl. BTW from a stored excl-BTW amount. */
export function inclBtwCents(exclCents: number, vatRate: number): number {
  return Math.round(exclCents * (1 + vatRate / 100));
}

export function formatCents(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Locale-agnostic euro formatter for the (English-only) admin back-office. */
export function formatEur(cents: number): string {
  return `€ ${(cents / 100).toFixed(2)}`;
}

/** Public URL for a file in the product-images bucket. */
export function productImageUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath}`;
}
