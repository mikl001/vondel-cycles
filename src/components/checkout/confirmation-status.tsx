"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the order status while it is pending — the fallback that makes the
 * confirmation page work even when the (Mollie) webhook is delayed.
 */
export function ConfirmationPoller({
  orderId,
  token,
  intervalMs = 3000,
}: {
  orderId: string;
  token: string;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?token=${token}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!stopped && data.status !== "pending") {
          clearInterval(timer);
          router.refresh();
        }
      } catch {}
    }, intervalMs);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [orderId, token, intervalMs, router]);

  return null;
}
