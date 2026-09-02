import { describe, expect, it } from "vitest";

import { countSolutions, generateSudoku } from "./templateLibrary";

const SEEDS = [1, 2, 3, 42, 12345, 999999, 2 ** 30 - 1];

describe("generateSudoku", () => {
  it("produces a puzzle with exactly one solution for every seed", () => {
    for (const seed of SEEDS) {
      const { puzzle } = generateSudoku(seed);
      expect(countSolutions(puzzle.map((row) => [...row]))).toBe(1);
    }
  });

  it("is deterministic: the same seed always yields the same puzzle", () => {
    for (const seed of SEEDS) {
      expect(generateSudoku(seed).puzzle).toEqual(generateSudoku(seed).puzzle);
    }
  });

  it("produces a different puzzle for each different seed", () => {
    const serialized = SEEDS.map((seed) => JSON.stringify(generateSudoku(seed).puzzle));
    expect(new Set(serialized).size).toBe(serialized.length);
  });

  it("keeps a sensible number of given clues (never blank, never fully solved)", () => {
    for (const seed of SEEDS) {
      const clues = generateSudoku(seed)
        .puzzle.flat()
        .filter((v) => v !== 0).length;
      // 17 è il minimo teorico noto per un Sudoku 9x9 a soluzione unica.
      expect(clues).toBeGreaterThan(17);
      expect(clues).toBeLessThan(81);
    }
  });
});
