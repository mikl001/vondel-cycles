"use client";

import { useEffect } from "react";

/**
 * Fires the cart:refresh signal once on mount so the header badge / mini-cart
 * resync after a server-side cart change that happened without remounting the
 * CartProvider — i.e. checkout conversion (order confirmation page) and the
 * guest→user merge on login (account landing page).
 */
export function CartRefreshOnMount() {
  useEffect(() => {
    window.dispatchEvent(new Event("cart:refresh"));
  }, []);
  return null;
}
