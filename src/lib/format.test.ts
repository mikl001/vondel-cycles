import { describe, expect, it } from "vitest";

import { inclBtwCents, lt } from "@/lib/format";

describe("inclBtwCents", () => {
  it("applies 21% BTW", () => {
    expect(inclBtwCents(10000, 21)).toBe(12100);
  });

  it("applies 9% BTW", () => {
    expect(inclBtwCents(10000, 9)).toBe(10900);
  });

  it("rounds half-up to whole cents", () => {
    // 4545 * 1.21 = 5499.45 -> 5499
    expect(inclBtwCents(4545, 21)).toBe(5499);
    // 4546 * 1.21 = 5500.66 -> 5501
    expect(inclBtwCents(4546, 21)).toBe(5501);
  });
});

describe("lt", () => {
  it("returns the requested locale", () => {
    expect(lt({ nl: "Fiets", en: "Bike" }, "en")).toBe("Bike");
  });

  it("falls back to nl", () => {
    expect(lt({ nl: "Fiets" } as never, "en")).toBe("Fiets");
  });

  it("handles null", () => {
    expect(lt(null, "nl")).toBe("");
  });
});
