"use client";

import { useState, useTransition } from "react";

import { setTrackingCode, updateOrderStatus } from "@/lib/admin/actions";
import { ORDER_TRANSITIONS } from "@/lib/orders/transitions";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-vondel-100 text-vondel-800",
  processing: "bg-blue-50 text-blue-800",
  shipped: "bg-blue-50 text-blue-800",
  delivered: "bg-vondel-100 text-vondel-800",
  pending: "bg-amber-50 text-amber-800",
  cancelled: "bg-red-50 text-red-700",
  refunded: "bg-purple-50 text-purple-700",
  failed: "bg-red-50 text-red-700",
};

export function OrderRowActions({
  orderId,
  status,
  trackingCode,
}: {
  orderId: string;
  status: string;
  trackingCode: string;
}) {
  const [tracking, setTracking] = useState(trackingCode);
  const [pending, startTransition] = useTransition();
  const options = ORDER_TRANSITIONS[status] ?? [];

  return (
    <>
      <td className="px-4 py-2.5">
        <span
          className={`mr-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {status}
        </span>
        {options.length > 0 && (
          <select
            value=""
            disabled={pending}
            aria-label="Change status"
            onChange={(e) => {
              const next = e.target.value;
              if (!next) return;
              if (next === "refunded" && !window.confirm("Issue a full refund?")) return;
              startTransition(() => updateOrderStatus(orderId, next));
            }}
            className="rounded border border-vondel-200 bg-white px-1.5 py-1 text-xs"
          >
            <option value="">→</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-1">
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="3SVC..."
            aria-label="Tracking code"
            className="w-28 rounded border border-vondel-200 px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={pending || tracking === trackingCode}
            onClick={() => startTransition(() => setTrackingCode(orderId, tracking))}
            className="rounded border border-vondel-300 px-2 py-1 text-xs text-vondel-700 hover:border-vondel-500 disabled:opacity-30"
          >
            Save
          </button>
        </span>
      </td>
    </>
  );
}
