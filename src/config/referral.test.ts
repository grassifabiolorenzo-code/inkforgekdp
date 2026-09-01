import { describe, expect, it } from "vitest";

import {
  calcProPrice,
  PRO_BASE_PRICE,
  PRO_MAX_DISCOUNT_REFERRALS,
  REFERRAL_CYCLE_BONUS_CREDITS,
  REFERRAL_CYCLE_LENGTH,
  REFERRAL_CYCLE_TOTAL_CREDITS,
  REFERRAL_LEVEL_REWARDS,
} from "./referral";

describe("calcProPrice — prezzo Pro in base agli attivi diretti", () => {
  // Casi esatti richiesti dalla specifica del programma referral.
  const cases: [number, number][] = [
    [0, 35],
    [9, 35],
    [10, 34],
    [19, 34],
    [20, 33],
    [99, 26],
    [100, 25],
    [199, 16],
    [200, 15],
    [299, 6],
    [300, 5],
    [349, 1],
    [350, 0],
    [351, 0],
  ];

  it.each(cases)("con %i referral attivi il prezzo è €%i", (activeReferrals, expectedPrice) => {
    expect(calcProPrice(activeReferrals)).toBe(expectedPrice);
  });

  it("non scende mai sotto zero anche con un numero di referral molto alto", () => {
    expect(calcProPrice(10_000)).toBe(0);
  });

  it("tratta un numero di referral negativo come zero (difesa, non dovrebbe mai accadere)", () => {
    expect(calcProPrice(-5)).toBe(PRO_BASE_PRICE);
  });

  it("la dinamica è simmetrica: scendere di attivi fa risalire il prezzo esattamente come nella tabella", () => {
    // 350 → 0, poi scendono a 300, poi 200, poi 100, poi 10, poi 0 — stessa formula, nessuno stato residuo.
    expect(calcProPrice(350)).toBe(0);
    expect(calcProPrice(300)).toBe(5);
    expect(calcProPrice(200)).toBe(15);
    expect(calcProPrice(100)).toBe(25);
    expect(calcProPrice(10)).toBe(34);
    expect(calcProPrice(0)).toBe(35);
  });

  it("il livello massimo di sconto corrisponde esattamente alla soglia configurata", () => {
    expect(calcProPrice(PRO_MAX_DISCOUNT_REFERRALS)).toBe(0);
    expect(calcProPrice(PRO_MAX_DISCOUNT_REFERRALS - 1)).toBeGreaterThan(0);
  });
});

describe("REFERRAL_LEVEL_REWARDS — crediti per posizione nel ciclo", () => {
  const expected = [300, 600, 750, 900, 1000, 1050, 1100, 1200, 1400, 2000];

  it("ha esattamente 10 livelli, uno per ogni posizione del ciclo", () => {
    expect(REFERRAL_LEVEL_REWARDS).toHaveLength(REFERRAL_CYCLE_LENGTH);
  });

  it.each(expected.map((credits, i) => [i + 1, credits] as const))(
    "il referral %i° del ciclo vale %i crediti",
    (position, credits) => {
      expect(REFERRAL_LEVEL_REWARDS[position - 1]).toBe(credits);
    },
  );

  it("il bonus di completamento ciclo è 1.000 crediti", () => {
    expect(REFERRAL_CYCLE_BONUS_CREDITS).toBe(1000);
  });

  it("il totale del primo ciclo (10 referral + bonus) è 11.300 crediti", () => {
    const sumOfLevels = REFERRAL_LEVEL_REWARDS.reduce((sum, c) => sum + c, 0);
    expect(sumOfLevels).toBe(10_300);
    expect(REFERRAL_CYCLE_TOTAL_CREDITS).toBe(11_300);
  });
});
