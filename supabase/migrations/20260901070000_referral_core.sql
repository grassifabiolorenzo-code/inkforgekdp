-- ============================================================================
-- SISTEMA REFERRAL — schema di base
-- ============================================================================
-- Riutilizza deliberatamente l'infrastruttura crediti/audit già esistente:
-- i crediti referral vivono in profiles.bonus_credits_remaining tramite la
-- stessa funzione add_purchased_credits() già usata per i pacchetti a
-- pagamento (stessa idempotenza via credit_transactions.operation_id); gli
-- eventi REFERRAL_* vengono scritti in audit_logs (admin_id NULL), non in una
-- tabella nuova. Nessun nuovo sistema di crediti o di audit parallelo.

-- Codice referral personale, stabile e univoco. Colonna su profiles (non una
-- tabella a parte: è un singolo valore per utente, come starter_bonus_granted).
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN referred_by_user_id UUID REFERENCES auth.users ON DELETE SET NULL;
CREATE INDEX profiles_referred_by_idx ON public.profiles (referred_by_user_id);

-- Il referrer non può mai essere cambiato una volta impostato: previene il
-- "cambio referral dopo la conversione" richiesto esplicitamente come anti-abuse.
CREATE OR REPLACE FUNCTION public.prevent_referrer_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.referred_by_user_id IS NOT NULL AND NEW.referred_by_user_id IS DISTINCT FROM OLD.referred_by_user_id THEN
    RAISE EXCEPTION 'referred_by_user_id è immutabile una volta impostato';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_referrer_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_referrer_change();

-- Configurazione centralizzata: soglie/valori modificabili senza migration
-- (vedi requisito esplicito "non tramite valori hardcoded sparsi nel codice").
CREATE TABLE public.referral_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_config TO authenticated;
GRANT ALL ON public.referral_config TO service_role;
ALTER TABLE public.referral_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_config_select_all" ON public.referral_config FOR SELECT TO authenticated USING (true);

-- Revisione dei parametri (v2): lo sconto si applica ora al piano REALE di
-- ciascun utente (Starter/Pro/Business), non solo a Pro — la base dello
-- sconto è quindi il prezzo del piano corrente dell'utente, letto da
-- public.plans al momento del calcolo, non più un valore fisso qui. Ritmo
-- reso più raggiungibile: -1 ogni 5 referral attivi (prima: ogni 10).
INSERT INTO public.referral_config (key, value) VALUES
  ('cycle_length', '10'),
  ('cycle_bonus_credits', '2000'),
  ('discount_per_step', '1'),
  ('referrals_per_step', '5'),
  ('new_user_first_month_discount_percent', '30');

-- Crediti per posizione nel ciclo (1..10). Tabella, non CASE hardcoded in SQL:
-- modificabile dall'admin in futuro senza toccare codice o funzioni. Valori
-- rivisti (v2) per essere più generosi/appetibili rispetto alla versione
-- iniziale (300..2.000+1.000 bonus, totale 11.300/ciclo).
CREATE TABLE public.referral_level_rewards (
  level INTEGER PRIMARY KEY CHECK (level BETWEEN 1 AND 10),
  credits INTEGER NOT NULL CHECK (credits >= 0)
);
GRANT SELECT ON public.referral_level_rewards TO authenticated;
GRANT ALL ON public.referral_level_rewards TO service_role;
ALTER TABLE public.referral_level_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_level_rewards_select_all" ON public.referral_level_rewards FOR SELECT TO authenticated USING (true);

INSERT INTO public.referral_level_rewards (level, credits) VALUES
  (1, 500), (2, 900), (3, 1200), (4, 1500), (5, 1800),
  (6, 2000), (7, 2200), (8, 2500), (9, 2800), (10, 3500);

-- La relazione referrer↔referred + macchina a stati. UNIQUE su referred_user_id:
-- un utente ha un solo referrer per sempre (stessa garanzia del trigger sopra,
-- a livello di relazione oltre che di colonna).
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'REGISTERED' CHECK (
    status IN ('CLICKED','REGISTERED','TRIAL','PENDING_PAYMENT','ACTIVE','CANCELLED','REFUNDED','CHARGEBACK','SUSPENDED')
  ),
  cycle_number INTEGER,
  position_in_cycle INTEGER,
  reward_credits INTEGER NOT NULL DEFAULT 0,
  reward_granted_at TIMESTAMPTZ,
  subscription_id UUID REFERENCES public.subscriptions ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (referrer_id <> referred_user_id) -- anti auto-referral a livello di constraint
);
CREATE INDEX referrals_referrer_idx ON public.referrals (referrer_id, status);
CREATE INDEX referrals_status_idx ON public.referrals (status);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
-- Un utente vede i referral che ha generato (come referrer) e la propria riga come invitato.
CREATE POLICY "referrals_select_own" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
CREATE TRIGGER referrals_touch BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Tracciamento cicli da 10 referral. Il ciclo "corrente" è quello con
-- completed = false più recente; se non esiste se ne crea uno nuovo.
CREATE TABLE public.referral_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL CHECK (cycle_number >= 1),
  referral_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  bonus_credits_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_number)
);
CREATE INDEX referral_cycles_user_idx ON public.referral_cycles (user_id);
GRANT SELECT ON public.referral_cycles TO authenticated;
GRANT ALL ON public.referral_cycles TO service_role;
ALTER TABLE public.referral_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_cycles_select_own" ON public.referral_cycles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER referral_cycles_touch BEFORE UPDATE ON public.referral_cycles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Cache dell'ultimo prezzo Pro calcolato/applicato per utente. pending_sync=true
-- quando il prezzo calcolato differisce da quanto risulta applicato su Lemon
-- Squeezy (es. perché il variant per quel prezzo non è ancora configurato):
-- il sistema resta corretto e riprova, non fallisce silenziosamente.
-- Nome storico ("pro_"), ma dalla v2 si applica al piano REALE dell'utente
-- (Starter/Pro/Business), non solo a Pro — vedi plan_slug/base_price sotto.
CREATE TABLE public.pro_referral_pricing (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  plan_slug TEXT,
  base_price NUMERIC(10,2),
  active_direct_referrals INTEGER NOT NULL DEFAULT 0,
  effective_price NUMERIC(10,2),
  applied_price NUMERIC(10,2),
  applied_lemon_squeezy_variant_id TEXT,
  pending_sync BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pro_referral_pricing TO authenticated;
GRANT ALL ON public.pro_referral_pricing TO service_role;
ALTER TABLE public.pro_referral_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pro_referral_pricing_select_own" ON public.pro_referral_pricing FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER pro_referral_pricing_touch BEFORE UPDATE ON public.pro_referral_pricing FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
