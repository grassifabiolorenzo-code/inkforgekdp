/**
 * Configurazione statica del programma referral, per la UI (copy, formattazione,
 * grafici di progressione). La fonte di verità per i CALCOLI resta il database
 * (tabella referral_config + funzioni calc_pro_price/advance_referral_cycle):
 * questi valori devono restare sincronizzati con quelli in
 * supabase/migrations/20260901070000_referral_core.sql, esattamente come
 * PLANS in config/plans.ts rispecchia (senza esserne l'origine) i prezzi reali
 * in public.plans.
 */

export const REFERRAL_CYCLE_LENGTH = 10;
export const REFERRAL_CYCLE_BONUS_CREDITS = 1000;
export const PRO_BASE_PRICE = 35;
export const PRO_DISCOUNT_PER_STEP = 1;
export const PRO_REFERRALS_PER_STEP = 10;
export const PRO_MAX_DISCOUNT_REFERRALS = 350;
export const NEW_USER_FIRST_MONTH_DISCOUNT_PERCENT = 30;

/** Crediti per posizione nel ciclo (1..10), rispecchia referral_level_rewards. */
export const REFERRAL_LEVEL_REWARDS: readonly number[] = [
  300, 600, 750, 900, 1000, 1050, 1100, 1200, 1400, 2000,
];

export const REFERRAL_CYCLE_TOTAL_CREDITS =
  REFERRAL_LEVEL_REWARDS.reduce((sum, credits) => sum + credits, 0) + REFERRAL_CYCLE_BONUS_CREDITS;

/** Stessa formula di calc_pro_price() in Postgres: max(0, base - floor(attivi/step) * sconto). */
export function calcProPrice(activeReferrals: number): number {
  const capped = Math.max(activeReferrals, 0);
  return Math.max(
    0,
    PRO_BASE_PRICE - Math.floor(capped / PRO_REFERRALS_PER_STEP) * PRO_DISCOUNT_PER_STEP,
  );
}

export const PRO_REFERRAL_DISCLAIMER = `Il prezzo del piano Pro è determinato dal numero di abbonati paganti attivi associati direttamente al tuo referral. Per ogni ${PRO_REFERRALS_PER_STEP} abbonati paganti attivi, il canone mensile viene ridotto di €${PRO_DISCOUNT_PER_STEP}, fino a un massimo di ${PRO_MAX_DISCOUNT_REFERRALS} abbonati attivi, corrispondente a un costo di €0/mese.

Il beneficio è legato agli abbonati attivi: se il numero di abbonati paganti diminuisce, il prezzo del tuo piano Pro viene ricalcolato automaticamente in base al nuovo livello. Se il numero di abbonati paganti attivi scende a zero, il piano Pro torna al prezzo standard di €${PRO_BASE_PRICE}/mese.

Il beneficio referral non può essere convertito in denaro, trasferito ad altri utenti né utilizzato per ottenere un rimborso relativo a periodi precedenti. Richiede un abbonamento Pro attivo.`;
