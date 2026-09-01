import { describe, expect, it } from "vitest";

import {
  calcReferralPrice,
  maxDiscountReferrals,
  REFERRAL_CYCLE_BONUS_CREDITS,
  REFERRAL_CYCLE_LENGTH,
  REFERRAL_CYCLE_TOTAL_CREDITS,
  REFERRAL_LEVEL_REWARDS,
} from "./referral";

describe("calcReferralPrice — prezzo scontato in base agli attivi diretti, per qualunque piano", () => {
  // Piano Pro (€35): casi esatti richiesti dalla specifica del programma referral,
  // ora con ritmo -€1 ogni 5 referral attivi (prima: ogni 10).
  const proCases: [number, number][] = [
    [0, 35],
    [4, 35],
    [5, 34],
    [9, 34],
    [10, 33],
    [50, 25],
    [100, 15],
    [170, 1],
    [174, 1],
    [175, 0],
    [176, 0],
  ];

  it.each(proCases)(
    "piano Pro (€35 base): con %i referral attivi il prezzo è €%i",
    (activeReferrals, expectedPrice) => {
      expect(calcReferralPrice(35, activeReferrals)).toBe(expectedPrice);
    },
  );

  // Piano Starter (€15): stesso ritmo, soglia di azzeramento più bassa.
  const starterCases: [number, number][] = [
    [0, 15],
    [4, 15],
    [5, 14],
    [70, 1],
    [74, 1],
    [75, 0],
    [80, 0],
  ];

  it.each(starterCases)(
    "piano Starter (€15 base): con %i referral attivi il prezzo è €%i",
    (activeReferrals, expectedPrice) => {
      expect(calcReferralPrice(15, activeReferrals)).toBe(expectedPrice);
    },
  );

  // Piano Business (€99): stesso ritmo, soglia di azzeramento più alta.
  const businessCases: [number, number][] = [
    [0, 99],
    [4, 99],
    [5, 98],
    [490, 1],
    [494, 1],
    [495, 0],
    [500, 0],
  ];

  it.each(businessCases)(
    "piano Business (€99 base): con %i referral attivi il prezzo è €%i",
    (activeReferrals, expectedPrice) => {
      expect(calcReferralPrice(99, activeReferrals)).toBe(expectedPrice);
    },
  );

  it("non scende mai sotto zero anche con un numero di referral molto alto, su nessun piano", () => {
    expect(calcReferralPrice(35, 10_000)).toBe(0);
    expect(calcReferralPrice(15, 10_000)).toBe(0);
    expect(calcReferralPrice(99, 10_000)).toBe(0);
  });

  it("tratta un numero di referral negativo come zero (difesa, non dovrebbe mai accadere)", () => {
    expect(calcReferralPrice(35, -5)).toBe(35);
  });

  it("la dinamica è simmetrica: scendere di attivi fa risalire il prezzo esattamente come nella tabella", () => {
    expect(calcReferralPrice(35, 175)).toBe(0);
    expect(calcReferralPrice(35, 100)).toBe(15);
    expect(calcReferralPrice(35, 50)).toBe(25);
    expect(calcReferralPrice(35, 10)).toBe(33);
    expect(calcReferralPrice(35, 0)).toBe(35);
  });

  it("il livello massimo di sconto corrisponde esattamente alla soglia calcolata, per ogni piano", () => {
    for (const basePrice of [15, 35, 99]) {
      const max = maxDiscountReferrals(basePrice);
      expect(calcReferralPrice(basePrice, max)).toBe(0);
      expect(calcReferralPrice(basePrice, max - 1)).toBeGreaterThan(0);
    }
  });

  it("maxDiscountReferrals riflette il nuovo ritmo (-1 ogni 5) per ciascun piano", () => {
    expect(maxDiscountReferrals(15)).toBe(75);
    expect(maxDiscountReferrals(35)).toBe(175);
    expect(maxDiscountReferrals(99)).toBe(495);
  });
});

describe("REFERRAL_LEVEL_REWARDS — crediti per posizione nel ciclo (tabella rivista, più generosa)", () => {
  const expected = [500, 900, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3500];

  it("ha esattamente 10 livelli, uno per ogni posizione del ciclo", () => {
    expect(REFERRAL_LEVEL_REWARDS).toHaveLength(REFERRAL_CYCLE_LENGTH);
  });

  it.each(expected.map((credits, i) => [i + 1, credits] as const))(
    "il referral %i° del ciclo vale %i crediti",
    (position, credits) => {
      expect(REFERRAL_LEVEL_REWARDS[position - 1]).toBe(credits);
    },
  );

  it("il bonus di completamento ciclo è 2.000 crediti", () => {
    expect(REFERRAL_CYCLE_BONUS_CREDITS).toBe(2000);
  });

  it("il totale del ciclo (10 referral + bonus) è 20.900 crediti", () => {
    const sumOfLevels = REFERRAL_LEVEL_REWARDS.reduce((sum, c) => sum + c, 0);
    expect(sumOfLevels).toBe(18_900);
    expect(REFERRAL_CYCLE_TOTAL_CREDITS).toBe(20_900);
  });
});
