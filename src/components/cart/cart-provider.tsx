"use client";

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
  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [pending, setPending] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // serialize mutations so optimistic state never races the server response
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart")
      .then((res) => (res.ok ? res.json() : EMPTY_CART))
      .then((data) => {
        if (!cancelled) setCart(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
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
      if (view) setDrawerOpen(true);
      return view !== null;
    },
    [mutate],
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
      await mutate(() =>
        fetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        }),
      );
    },
    [mutate],
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
      await mutate(() => fetch(`/api/cart/items/${itemId}`, { method: "DELETE" }));
    },
    [mutate],
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
