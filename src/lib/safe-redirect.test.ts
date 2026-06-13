import { describe, expect, it } from "vitest";

import { resolveSafeNext } from "@/lib/safe-redirect";

const ORIGIN = "https://shop.example.com";

describe("resolveSafeNext (open-redirect guard)", () => {
  it("preserves a genuine same-origin path with query and hash", () => {
    expect(resolveSafeNext("/en/account", ORIGIN)).toBe("/en/account");
    expect(resolveSafeNext("/nl/zoeken?q=fiets#top", ORIGIN)).toBe(
      "/nl/zoeken?q=fiets#top",
    );
  });

  it("rejects protocol-relative and absolute off-origin targets", () => {
    expect(resolveSafeNext("//evil.com", ORIGIN)).toBe("/nl");
    expect(resolveSafeNext("https://evil.com", ORIGIN)).toBe("/nl");
    expect(resolveSafeNext("https://evil.com/path", ORIGIN)).toBe("/nl");
  });

  it("rejects the control-character bypasses the URL parser strips", () => {
    // these are exactly the inputs that defeat a naive string/regex guard
    expect(resolveSafeNext("/\t//evil.com", ORIGIN)).toBe("/nl");
    expect(resolveSafeNext("/\r\n//evil.com", ORIGIN)).toBe("/nl");
    expect(resolveSafeNext("\t//evil.com", ORIGIN)).toBe("/nl");
  });

  it("rejects a userinfo-smuggled host", () => {
    expect(resolveSafeNext("https://shop.example.com@evil.com", ORIGIN)).toBe("/nl");
  });

  it("keeps backslash/encoded inputs on our origin (404 path, never off-domain)", () => {
    // backslash resolves to a same-origin path; encoded slashes stay literal
    expect(resolveSafeNext("/\\evil.com", ORIGIN).startsWith("/")).toBe(true);
    expect(resolveSafeNext("/\\evil.com", ORIGIN)).not.toMatch(/^\/\//);
    expect(resolveSafeNext("/%2F%2Fevil.com", ORIGIN)).toBe("/%2F%2Fevil.com");
  });

  it("normalizes empty/odd input to a same-origin path", () => {
    expect(resolveSafeNext("", ORIGIN)).toBe("/");
    expect(resolveSafeNext("not a url at all", ORIGIN)).toBe("/not%20a%20url%20at%20all");
  });
});
