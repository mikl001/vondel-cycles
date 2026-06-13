"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { EMPTY_CART, type CartView } from "@/types/cart";

interface CartContextValue {
  cart: CartView;
  /** true while the initial fetch or a mutation is in flight */
  pending: boolean;
  /** drawer state, toggled from header and after add-to-cart */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("cart");
  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [pending, setPending] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // screen-reader announcement for cart changes (rendered in a live region)
  const [announce, setAnnounce] = useState("");
  // serialize mutations so optimistic state never races the server response
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/cart")
        .then((res) => (res.ok ? res.json() : EMPTY_CART))
        .then((data) => {
          if (!cancelled) setCart(data);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setPending(false);
        });
    void load();
    // external mutations (reorder, login merge) re-fetch via this event
    const onRefresh = () => void load();
    window.addEventListener("cart:refresh", onRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener("cart:refresh", onRefresh);
    };
  }, []);

  const mutate = useCallback(
    async (request: () => Promise<Response>): Promise<CartView | null> => {
      setPending(true);
      const run = queue.current.then(async () => {
        const res = await request();
        if (!res.ok) throw Object.assign(new Error("cart request failed"), { res });
        return (await res.json()) as CartView;
      });
      queue.current = run.catch(() => {});
      try {
        const view = await run;
        setCart(view);
        return view;
      } catch {
        // refetch to resync after a failed mutation
        try {
          const res = await fetch("/api/cart");
          if (res.ok) setCart(await res.json());
        } catch {}
        return null;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      const view = await mutate(() =>
        fetch("/api/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, quantity }),
        }),
      );
      if (view) {
        setDrawerOpen(true);
        // the add endpoint augments the cart view with an `adjusted` flag
        const adjusted = (view as CartView & { adjusted?: boolean }).adjusted;
        // include the new count so consecutive identical adds still change the
        // live-region text and get re-announced
        setAnnounce(
          `${adjusted ? t("adjusted") : t("addedToCart")} (${view.itemCount})`,
        );
      }
      return view !== null;
    },
    [mutate, t],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      // optimistic: update the line + recompute count immediately
      setCart((current) => ({
        ...current,
        items: current.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        itemCount: current.items.reduce(
          (sum, i) => sum + (i.id === itemId ? quantity : i.quantity),
          0,
        ),
      }));
      const view = await mutate(() =>
        fetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        }),
      );
      if (view) setAnnounce(`${t("cartUpdated")} (${view.itemCount})`);
    },
    [mutate, t],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setCart((current) => {
        const items = current.items.filter((i) => i.id !== itemId);
        return {
          ...current,
          items,
          itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        };
      });
      const view = await mutate(() =>
        fetch(`/api/cart/items/${itemId}`, { method: "DELETE" }),
      );
      if (view) setAnnounce(`${t("cartUpdated")} (${view.itemCount})`);
    },
    [mutate, t],
  );

  const value = useMemo(
    () => ({
      cart,
      pending,
      drawerOpen,
      setDrawerOpen,
      addToCart,
      updateQuantity,
      removeItem,
    }),
    [cart, pending, drawerOpen, addToCart, updateQuantity, removeItem],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
    </CartContext.Provider>
  );
}
