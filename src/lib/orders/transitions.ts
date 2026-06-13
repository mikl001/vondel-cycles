/**
 * Allowed order-status transitions — the SINGLE source of truth shared by the
 * admin server action (authoritative validation in updateOrderStatus) and the
 * admin UI (which target statuses to offer in OrderRowActions). Keeping one
 * map prevents the two from drifting: e.g. the 'cancelled' -> 'refunded'
 * operator escape hatch (finishing a refund on an oversold/auto-cancelled
 * order whose automatic refund failed) must be both validated AND offered.
 */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: ["refunded"],
};
