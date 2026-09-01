/**
 * Configurazione statica del programma referral, per la UI (copy, formattazione,
 * grafici di progressione). La fonte di verità per i CALCOLI resta il database
 * (tabella referral_config + funzioni calc_referral_price/advance_referral_cycle):
 * questi valori devono restare sincronizzati con quelli in
 * supabase/migrations/20260901070000_referral_core.sql, esattamente come
 * PLANS in config/plans.ts rispecchia (senza esserne l'origine) i prezzi reali
 * in public.plans.
 *
 * v2: lo sconto si applica al piano REALE dell'utente (Starter/Pro/Business),
 * non più solo a Pro — perciò non esiste più un prezzo base fisso qui:
 * calcReferralPrice() richiede il prezzo del piano corrente come parametro.
 */

export const REFERRAL_CYCLE_LENGTH = 10;
export const REFERRAL_CYCLE_BONUS_CREDITS = 2000;
export const REFERRAL_DISCOUNT_PER_STEP = 1;
export const REFERRAL_REFERRALS_PER_STEP = 5;
export const NEW_USER_FIRST_MONTH_DISCOUNT_PERCENT = 30;

/** Crediti per posizione nel ciclo (1..10), rispecchia referral_level_rewards. */
export const REFERRAL_LEVEL_REWARDS: readonly number[] = [
  500, 900, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3500,
];

export const REFERRAL_CYCLE_TOTAL_CREDITS =
  REFERRAL_LEVEL_REWARDS.reduce((sum, credits) => sum + credits, 0) + REFERRAL_CYCLE_BONUS_CREDITS;

/** Stessa formula di calc_referral_price() in Postgres: max(0, base - floor(attivi/step) * sconto). */
export function calcReferralPrice(basePrice: number, activeReferrals: number): number {
  const capped = Math.max(activeReferrals, 0);
  return Math.max(
    0,
    basePrice - Math.floor(capped / REFERRAL_REFERRALS_PER_STEP) * REFERRAL_DISCOUNT_PER_STEP,
  );
}

/** Numero di referral attivi oltre il quale il piano costa €0/mese, per un dato prezzo base. */
export function maxDiscountReferrals(basePrice: number): number {
  return Math.ceil(basePrice / REFERRAL_DISCOUNT_PER_STEP) * REFERRAL_REFERRALS_PER_STEP;
}

export const REFERRAL_DISCLAIMER = `Il prezzo del tuo abbonamento (Starter, Pro o Business) è determinato dal numero di abbonati paganti attivi associati direttamente al tuo referral. Per ogni ${REFERRAL_REFERRALS_PER_STEP} abbonati paganti attivi, il canone mensile viene ridotto di €${REFERRAL_DISCOUNT_PER_STEP}, fino ad arrivare a un costo di €0/mese indipendentemente dal piano scelto.

Il beneficio è legato agli abbonati attivi: se il numero di abbonati paganti diminuisce, il prezzo del tuo piano viene ricalcolato automaticamente in base al nuovo livello. Se il numero di abbonati paganti attivi scende a zero, il piano torna al prezzo standard.

Il beneficio referral non può essere convertito in denaro, trasferito ad altri utenti né utilizzato per ottenere un rimborso relativo a periodi precedenti. Richiede un abbonamento attivo su un qualsiasi piano.`;
