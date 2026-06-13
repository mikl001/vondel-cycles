import { describe, expect, it } from "vitest";

import { ipFromHeaders } from "@/lib/client-ip";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("ipFromHeaders (rate-limit IP source)", () => {
  it("prefers the platform x-real-ip", () => {
    expect(
      ipFromHeaders(headers({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" })),
    ).toBe("9.9.9.9");
  });

  it("uses the RIGHTMOST x-forwarded-for hop, not the spoofable leftmost", () => {
    // a client prefixes its own spoofed entry; the trusted proxy appends the
    // real client last — we must take the last, never the first
    expect(ipFromHeaders(headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.7" }))).toBe(
      "203.0.113.7",
    );
    expect(
      ipFromHeaders(headers({ "x-forwarded-for": "spoofed, evil, 203.0.113.7" })),
    ).toBe("203.0.113.7");
  });

  it("handles a single-value x-forwarded-for", () => {
    expect(ipFromHeaders(headers({ "x-forwarded-for": "203.0.113.7" }))).toBe(
      "203.0.113.7",
    );
  });

  it("falls back to 'unknown' when no IP headers are present", () => {
    expect(ipFromHeaders(headers({}))).toBe("unknown");
    expect(ipFromHeaders(headers({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
