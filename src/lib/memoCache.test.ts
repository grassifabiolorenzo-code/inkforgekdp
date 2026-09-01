import { describe, expect, it, vi } from "vitest";

import { memoize } from "./memoCache.server";

describe("memoize", () => {
  it("chiama compute() una sola volta per chiamate ravvicinate con la stessa chiave", async () => {
    const compute = vi.fn().mockResolvedValue("value");
    const key = `test-${Math.random()}`;

    const first = await memoize(key, 60, compute);
    const second = await memoize(key, 60, compute);

    expect(first).toBe("value");
    expect(second).toBe("value");
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it("richiama compute() di nuovo dopo la scadenza del TTL", async () => {
    const compute = vi.fn().mockResolvedValue("value");
    const key = `test-${Math.random()}`;

    await memoize(key, 0, compute);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await memoize(key, 0, compute);

    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("non mette in cache un fallimento: il prossimo tentativo richiama compute()", async () => {
    const key = `test-${Math.random()}`;
    const compute = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("recovered");

    await expect(memoize(key, 60, compute)).rejects.toThrow("boom");
    const result = await memoize(key, 60, compute);

    expect(result).toBe("recovered");
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("chiavi diverse non condividono il valore in cache", async () => {
    const computeA = vi.fn().mockResolvedValue("a");
    const computeB = vi.fn().mockResolvedValue("b");
    const suffix = Math.random();

    const a = await memoize(`key-a-${suffix}`, 60, computeA);
    const b = await memoize(`key-b-${suffix}`, 60, computeB);

    expect(a).toBe("a");
    expect(b).toBe("b");
  });
});
