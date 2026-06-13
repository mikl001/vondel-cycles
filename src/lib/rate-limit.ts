import "server-only";

import type { NextRequest } from "next/server";

/**
 * Sliding-window rate limiter. Uses Upstash Redis when configured (required
 * in production — Vercel runs many instances, in-memory state won't hold);
 * falls back to a per-instance in-memory window for local dev and CI.
 */

interface Window {
  timestamps: number[];
}

const memory = new Map<string, Window>();
const MEMORY_CAP = 10_000;

async function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const entry = memory.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  if (entry.timestamps.length >= limit) return false;
  entry.timestamps.push(now);
  memory.set(key, entry);
  if (memory.size > MEMORY_CAP) {
    // crude eviction: drop the oldest half
    const keys = [...memory.keys()].slice(0, MEMORY_CAP / 2);
    keys.forEach((k) => memory.delete(k));
  }
  return true;
}

async function upstashLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const now = Date.now();
  const windowStart = now - windowMs;
  // ZREMRANGEBYSCORE + ZCARD + ZADD + PEXPIRE in one pipeline
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify([
      ["ZREMRANGEBYSCORE", key, "0", String(windowStart)],
      ["ZCARD", key],
      ["ZADD", key, String(now), `${now}-${Math.random().toString(36).slice(2)}`],
      ["PEXPIRE", key, String(windowMs)],
    ]),
  });
  if (!res.ok) return true; // fail-open: availability over strictness
  const results = (await res.json()) as { result: number }[];
  return (results[1]?.result ?? 0) < limit;
}

export function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Returns true when the request is allowed.
 * `name` scopes the limit per endpoint; identity defaults to the client IP.
 */
export async function rateLimit(
  request: NextRequest,
  name: string,
  opts: { limit: number; windowMs: number },
): Promise<boolean> {
  const key = `rl:${name}:${clientIp(request)}`;
  const hasUpstash =
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  try {
    return hasUpstash
      ? await upstashLimit(key, opts.limit, opts.windowMs)
      : await memoryLimit(key, opts.limit, opts.windowMs);
  } catch {
    return true; // fail-open
  }
}

export const LIMITS = {
  checkout: { limit: 10, windowMs: 60_000 },
  preview: { limit: 40, windowMs: 60_000 },
  cartMutation: { limit: 60, windowMs: 60_000 },
  postcode: { limit: 30, windowMs: 60_000 },
  pickup: { limit: 30, windowMs: 60_000 },
  suggest: { limit: 60, windowMs: 60_000 },
  mockPayment: { limit: 20, windowMs: 60_000 },
  wishlist: { limit: 60, windowMs: 60_000 },
  account: { limit: 10, windowMs: 60_000 },
  invoice: { limit: 20, windowMs: 60_000 },
} as const;
