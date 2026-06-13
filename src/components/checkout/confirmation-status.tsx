"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the order status while it is pending — the fallback that makes the
 * confirmation page resolve even when the (Mollie) webhook is delayed.
 * Bounded: it backs off (3s → 6s → … capped), pauses while the tab is hidden,
 * and gives up after a deadline so an abandoned payment can't poll forever.
 */
export function ConfirmationPoller({
  orderId,
  token,
  maxAttempts = 40,
}: {
  orderId: string;
  token: string;
  maxAttempts?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      // 3s, then grow gently, capped at 15s
      const delay = Math.min(3000 * Math.ceil((attempts + 1) / 3), 15000);
      timeout = setTimeout(tick, delay);
    };

    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }
      attempts++;
      try {
        const res = await fetch(`/api/orders/${orderId}?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          if (!stopped && data.status !== "pending") {
            router.refresh();
            return;
          }
        }
      } catch {
        // transient — keep polling within the attempt budget
      }
      if (!stopped && attempts < maxAttempts) schedule();
    };

    schedule();
    return () => {
      stopped = true;
      clearTimeout(timeout);
    };
  }, [orderId, token, maxAttempts, router]);

  return null;
}
