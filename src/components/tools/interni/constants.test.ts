import { describe, expect, it } from "vitest";

import { TRIM_SIZES, suggestedKdpMargins } from "./constants";

describe("TRIM_SIZES", () => {
  it("contains all 16 official KDP paperback trim sizes, each with a unique id", () => {
    expect(TRIM_SIZES).toHaveLength(16);
    expect(new Set(TRIM_SIZES.map((t) => t.id)).size).toBe(16);
  });

  it("every size has positive dimensions and a valid category", () => {
    for (const t of TRIM_SIZES) {
      expect(t.widthIn).toBeGreaterThan(0);
      expect(t.heightIn).toBeGreaterThan(0);
      expect(["Standard", "Grande"]).toContain(t.category);
    }
  });
});

describe("suggestedKdpMargins", () => {
  // Tabella ufficiale KDP: https://kdp.amazon.com/help?topicId=GVBQ3CMEQW3W2VL6
  it("scales the inside (gutter) margin with page count per the official KDP table", () => {
    expect(suggestedKdpMargins(50, false).insideIn).toBe(0.375); // 24-150
    expect(suggestedKdpMargins(150, false).insideIn).toBe(0.375);
    expect(suggestedKdpMargins(200, false).insideIn).toBe(0.5); // 151-300
    expect(suggestedKdpMargins(400, false).insideIn).toBe(0.625); // 301-500
    expect(suggestedKdpMargins(600, false).insideIn).toBe(0.75); // 501-700
    expect(suggestedKdpMargins(800, false).insideIn).toBe(0.875); // 701-828
    expect(suggestedKdpMargins(10000, false).insideIn).toBe(0.875); // oltre la tabella: resta al massimo
  });

  it("uses 0.25in outside/top/bottom without bleed, 0.375in with bleed", () => {
    const noBleed = suggestedKdpMargins(100, false);
    expect(noBleed.topIn).toBe(0.25);
    expect(noBleed.bottomIn).toBe(0.25);
    expect(noBleed.outsideIn).toBe(0.25);

    const withBleed = suggestedKdpMargins(100, true);
    expect(withBleed.topIn).toBe(0.375);
    expect(withBleed.bottomIn).toBe(0.375);
    expect(withBleed.outsideIn).toBe(0.375);
  });
});
