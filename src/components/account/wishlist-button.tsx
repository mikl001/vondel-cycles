"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useRouter } from "@/i18n/navigation";

export function WishlistButton({ productId }: { productId: string }) {
  const t = useTranslations("account.wishlist");
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data: { productIds: string[]; authenticated: boolean }) => {
        if (cancelled) return;
        setAuthenticated(data.authenticated);
        setWishlisted(data.productIds.includes(productId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function toggle() {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    setWishlisted((w) => !w); // optimistic
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
      }
    } catch {
      setWishlisted((w) => !w);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
      title={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
      className={`rounded-xl border px-4 py-3.5 transition-colors ${
        wishlisted
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-vondel-200 text-vondel-400 hover:border-vondel-400 hover:text-vondel-600"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.4 4.5 6 4.5c2.2 0 3.7 1.2 4.6 2.6.3.5.4.8.4.8s.1-.3.4-.8c.9-1.4 2.4-2.6 4.6-2.6 3.6 0 5.5 3.5 4 7.2C19.5 16.3 12 21 12 21z" />
      </svg>
    </button>
  );
}
