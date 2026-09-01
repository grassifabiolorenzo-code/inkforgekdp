-- Estensione retrocompatibile di add_purchased_credits: aggiunge _source e
-- _tool_id opzionali (default = comportamento identico a prima) per poter
-- distinguere in credit_transactions i crediti da referral da quelli dei
-- pacchetti a pagamento, senza duplicare la funzione né toccare le chiamate
-- esistenti (webhook pacchetti crediti continua a funzionare invariato).
CREATE OR REPLACE FUNCTION public.add_purchased_credits(
  _user_id UUID,
  _amount INTEGER,
  _operation_id TEXT,
  _description TEXT DEFAULT NULL,
  _source TEXT DEFAULT 'purchase',
  _tool_id TEXT DEFAULT 'credit_pack'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing RECORD;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'user_id required'; END IF;
  IF _operation_id IS NULL OR length(trim(_operation_id)) = 0 THEN RAISE EXCEPTION 'operation_id required'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;

  SELECT * INTO existing FROM public.credit_transactions WHERE user_id = _user_id AND operation_id = _operation_id;
  IF existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  UPDATE public.profiles SET bonus_credits_remaining = bonus_credits_remaining + _amount WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found for user %', _user_id; END IF;

  INSERT INTO public.credit_transactions (user_id, tool_id, operation_id, transaction_type, amount, source, description)
  VALUES (_user_id, _tool_id, _operation_id, 'purchase', _amount, _source, _description);

  RETURN jsonb_build_object('ok', true, 'duplicate', false);
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_purchased_credits(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ============================================================================
-- Formula prezzo referral: max(0, prezzo_piano - floor(referral_attivi / referral_per_step) * sconto_per_step)
-- Generica dalla v2: si applica al prezzo del piano REALE dell'utente
-- (Starter/Pro/Business), passato come parametro — non più un prezzo fisso.
-- Legge le soglie da referral_config, non hardcoded: modificabile senza
-- toccare codice.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calc_referral_price(_base_price NUMERIC, _active_referrals INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  step_discount NUMERIC;
  per_step INTEGER;
BEGIN
  SELECT (value #>> '{}')::numeric INTO step_discount FROM public.referral_config WHERE key = 'discount_per_step';
  SELECT (value #>> '{}')::integer INTO per_step FROM public.referral_config WHERE key = 'referrals_per_step';

  RETURN GREATEST(0, COALESCE(_base_price, 0) - FLOOR(GREATEST(_active_referrals, 0)::numeric / COALESCE(per_step, 5)) * COALESCE(step_discount, 1));
END;
$$;
REVOKE ALL ON FUNCTION public.calc_referral_price(NUMERIC, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calc_referral_price(NUMERIC, INTEGER) TO service_role, authenticated;

CREATE OR REPLACE FUNCTION public.count_active_direct_referrals(_referrer_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.referrals WHERE referrer_id = _referrer_id AND status = 'ACTIVE';
$$;
REVOKE ALL ON FUNCTION public.count_active_direct_referrals(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_direct_referrals(UUID) TO service_role;

-- Ricalcola e memorizza il prezzo dell'utente in base agli attivi correnti E
-- al piano a cui è REALMENTE abbonato in questo momento (Starter/Pro/Business
-- hanno tutti diritto allo sconto, dalla v2 — non solo Pro). Se l'utente non
-- ha un abbonamento attivo/in trial, non c'è alcun prezzo da scontare: la riga
-- viene comunque aggiornata con il conteggio attivi (utile per la dashboard),
-- ma plan_slug/base_price/effective_price restano NULL e pending_sync resta
-- false (niente da sincronizzare su Lemon Squeezy). pending_sync=true quando
-- il prezzo calcolato differisce da quanto risulta applicato: il server
-- tenterà l'aggiornamento reale (vedi referral.server.ts) e lo azzererà solo
-- dopo la conferma di successo.
CREATE OR REPLACE FUNCTION public.recompute_referrer_pricing(_referrer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count INTEGER;
  current_plan RECORD;
  new_price NUMERIC;
  prev_price NUMERIC;
  needs_sync BOOLEAN;
BEGIN
  active_count := public.count_active_direct_referrals(_referrer_id);

  SELECT pl.slug, pl.price INTO current_plan
  FROM public.subscriptions s
  JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.user_id = _referrer_id AND s.status IN ('active', 'on_trial')
  ORDER BY s.updated_at DESC
  LIMIT 1;

  SELECT effective_price INTO prev_price FROM public.pro_referral_pricing WHERE user_id = _referrer_id;

  IF current_plan.slug IS NULL THEN
    -- Nessun piano attivo: nessuno sconto applicabile, ma il conteggio va comunque aggiornato.
    INSERT INTO public.pro_referral_pricing (user_id, active_direct_referrals, plan_slug, base_price, effective_price, pending_sync)
    VALUES (_referrer_id, active_count, NULL, NULL, NULL, false)
    ON CONFLICT (user_id) DO UPDATE SET
      active_direct_referrals = EXCLUDED.active_direct_referrals,
      plan_slug = NULL, base_price = NULL, effective_price = NULL, pending_sync = false;

    RETURN jsonb_build_object(
      'active_direct_referrals', active_count, 'effective_price', NULL,
      'previous_price', prev_price, 'changed', prev_price IS NOT NULL
    );
  END IF;

  new_price := public.calc_referral_price(current_plan.price, active_count);
  needs_sync := prev_price IS DISTINCT FROM new_price;

  INSERT INTO public.pro_referral_pricing (user_id, active_direct_referrals, plan_slug, base_price, effective_price, pending_sync)
  VALUES (_referrer_id, active_count, current_plan.slug, current_plan.price, new_price, true)
  ON CONFLICT (user_id) DO UPDATE SET
    active_direct_referrals = EXCLUDED.active_direct_referrals,
    plan_slug = EXCLUDED.plan_slug,
    base_price = EXCLUDED.base_price,
    effective_price = EXCLUDED.effective_price,
    pending_sync = (public.pro_referral_pricing.applied_price IS DISTINCT FROM EXCLUDED.effective_price)
                   OR (public.pro_referral_pricing.plan_slug IS DISTINCT FROM EXCLUDED.plan_slug)
                   OR public.pro_referral_pricing.pending_sync;

  RETURN jsonb_build_object(
    'active_direct_referrals', active_count,
    'plan_slug', current_plan.slug,
    'base_price', current_plan.price,
    'effective_price', new_price,
    'previous_price', prev_price,
    'changed', needs_sync
  );
END;
$$;
REVOKE ALL ON FUNCTION public.recompute_referrer_pricing(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_referrer_pricing(UUID) TO service_role;

-- Segna il prezzo come effettivamente sincronizzato su Lemon Squeezy (chiamata
-- dal server dopo un updateSubscriptionVariant riuscito, o quando il piano
-- non è ancora Pro/il variant non è configurato non c'è nulla da segnare qui).
CREATE OR REPLACE FUNCTION public.mark_pro_pricing_synced(_user_id UUID, _applied_price NUMERIC, _variant_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.pro_referral_pricing
  SET applied_price = _applied_price, applied_lemon_squeezy_variant_id = _variant_id, pending_sync = false
  WHERE user_id = _user_id;
$$;
REVOKE ALL ON FUNCTION public.mark_pro_pricing_synced(UUID, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_pro_pricing_synced(UUID, NUMERIC, TEXT) TO service_role;

-- ============================================================================
-- Referral code: generazione idempotente e lookup.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.ensure_referral_code(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing TEXT;
  candidate TEXT;
  attempt INTEGER := 0;
BEGIN
  SELECT referral_code INTO existing FROM public.profiles WHERE id = _user_id;
  IF existing IS NOT NULL THEN RETURN existing; END IF;

  LOOP
    candidate := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    BEGIN
      UPDATE public.profiles SET referral_code = candidate WHERE id = _user_id AND referral_code IS NULL;
      IF FOUND THEN RETURN candidate; END IF;
      SELECT referral_code INTO existing FROM public.profiles WHERE id = _user_id;
      IF existing IS NOT NULL THEN RETURN existing; END IF;
    EXCEPTION WHEN unique_violation THEN
      attempt := attempt + 1;
      IF attempt > 10 THEN RAISE EXCEPTION 'impossibile generare un referral_code univoco'; END IF;
    END;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_referral_code(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_referral_code(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.find_referrer_by_code(_code TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE referral_code = upper(_code);
$$;
REVOKE ALL ON FUNCTION public.find_referrer_by_code(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_referrer_by_code(TEXT) TO service_role;

-- Associa un nuovo utente al referrer indicato dal codice. Va chiamata UNA
-- SOLA VOLTA, nello stesso punto in cui il profilo viene creato al primo
-- accesso: questo garantisce da solo che non si possa "aggiungere" un
-- referral dopo la registrazione (non esiste un altro punto di ingresso).
CREATE OR REPLACE FUNCTION public.register_referral(_referred_user_id UUID, _referral_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer UUID;
  already_referred UUID;
BEGIN
  SELECT referred_by_user_id INTO already_referred FROM public.profiles WHERE id = _referred_user_id;
  IF already_referred IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_referred');
  END IF;

  referrer := public.find_referrer_by_code(_referral_code);
  IF referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;
  IF referrer = _referred_user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  UPDATE public.profiles SET referred_by_user_id = referrer WHERE id = _referred_user_id;

  INSERT INTO public.referrals (referrer_id, referred_user_id, status)
  VALUES (referrer, _referred_user_id, 'REGISTERED')
  ON CONFLICT (referred_user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'referrer_id', referrer);
END;
$$;
REVOKE ALL ON FUNCTION public.register_referral(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_referral(UUID, TEXT) TO service_role;

-- Avanza atomicamente il ciclo corrente del referrer: trova/crea il ciclo non
-- completato, incrementa il contatore, determina i crediti del livello e se
-- il ciclo si è appena completato. FOR UPDATE previene race condition se due
-- referral dello stesso referrer si attivano in rapida successione.
CREATE OR REPLACE FUNCTION public.advance_referral_cycle(_referrer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cycle_length INTEGER;
  bonus_credits INTEGER;
  current_cycle RECORD;
  level_credits INTEGER;
  just_completed BOOLEAN := false;
BEGIN
  SELECT (value #>> '{}')::integer INTO cycle_length FROM public.referral_config WHERE key = 'cycle_length';
  SELECT (value #>> '{}')::integer INTO bonus_credits FROM public.referral_config WHERE key = 'cycle_bonus_credits';
  cycle_length := COALESCE(cycle_length, 10);
  bonus_credits := COALESCE(bonus_credits, 1000);

  SELECT * INTO current_cycle FROM public.referral_cycles
    WHERE user_id = _referrer_id AND completed = false
    ORDER BY cycle_number DESC LIMIT 1 FOR UPDATE;

  IF current_cycle.id IS NULL THEN
    INSERT INTO public.referral_cycles (user_id, cycle_number, referral_count)
    VALUES (_referrer_id, 1, 0)
    RETURNING * INTO current_cycle;
  END IF;

  UPDATE public.referral_cycles
    SET referral_count = referral_count + 1
    WHERE id = current_cycle.id
    RETURNING * INTO current_cycle;

  SELECT credits INTO level_credits FROM public.referral_level_rewards WHERE level = current_cycle.referral_count;
  level_credits := COALESCE(level_credits, 0);

  IF current_cycle.referral_count >= cycle_length THEN
    UPDATE public.referral_cycles SET completed = true, completed_at = now() WHERE id = current_cycle.id;
    just_completed := true;
  END IF;

  RETURN jsonb_build_object(
    'cycle_number', current_cycle.cycle_number,
    'position_in_cycle', current_cycle.referral_count,
    'level_credits', level_credits,
    'cycle_completed', just_completed,
    'bonus_credits', CASE WHEN just_completed THEN bonus_credits ELSE 0 END
  );
END;
$$;
REVOKE ALL ON FUNCTION public.advance_referral_cycle(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_referral_cycle(UUID) TO service_role;

-- ============================================================================
-- Attivazione di un referral: l'unico punto in cui un referral REGISTERED/
-- TRIAL/PENDING_PAYMENT diventa ACTIVE, i crediti vengono erogati e il prezzo
-- Pro del referrer viene ricalcolato. Idempotente: se già ACTIVE, no-op.
-- Se il premio era già stato erogato in passato (riattivazione dopo
-- CANCELLED/REFUNDED), NON lo eroga una seconda volta — solo il prezzo Pro
-- torna a contare questo referral come attivo.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.activate_referral(_referred_user_id UUID, _subscription_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref RECORD;
  cycle_info JSONB;
  level_credits INTEGER;
  bonus_credits INTEGER;
  cycle_completed BOOLEAN;
BEGIN
  SELECT * INTO ref FROM public.referrals WHERE referred_user_id = _referred_user_id FOR UPDATE;
  IF ref.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_referral');
  END IF;
  IF ref.status = 'ACTIVE' THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'referral_id', ref.id);
  END IF;
  IF ref.status IN ('CHARGEBACK', 'SUSPENDED') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'blocked_status', 'status', ref.status);
  END IF;

  IF ref.reward_granted_at IS NOT NULL THEN
    UPDATE public.referrals
      SET status = 'ACTIVE', activated_at = now(), cancelled_at = NULL,
          subscription_id = COALESCE(_subscription_id, subscription_id)
      WHERE id = ref.id;
    PERFORM public.recompute_referrer_pricing(ref.referrer_id);
    RETURN jsonb_build_object('ok', true, 'reactivated', true, 'referral_id', ref.id, 'referrer_id', ref.referrer_id);
  END IF;

  cycle_info := public.advance_referral_cycle(ref.referrer_id);
  level_credits := (cycle_info ->> 'level_credits')::integer;
  cycle_completed := (cycle_info ->> 'cycle_completed')::boolean;
  bonus_credits := (cycle_info ->> 'bonus_credits')::integer;

  UPDATE public.referrals SET
    status = 'ACTIVE',
    activated_at = now(),
    cycle_number = (cycle_info ->> 'cycle_number')::integer,
    position_in_cycle = (cycle_info ->> 'position_in_cycle')::integer,
    reward_credits = level_credits,
    reward_granted_at = now(),
    subscription_id = COALESCE(_subscription_id, subscription_id)
  WHERE id = ref.id;

  IF level_credits > 0 THEN
    PERFORM public.add_purchased_credits(
      ref.referrer_id, level_credits, 'referral-reward:' || ref.id::text,
      'Premio referral: ' || (cycle_info ->> 'position_in_cycle') || 'esimo abbonato pagante',
      'referral', 'referral'
    );
  END IF;

  IF cycle_completed AND bonus_credits > 0 THEN
    PERFORM public.add_purchased_credits(
      ref.referrer_id, bonus_credits,
      'referral-cycle-bonus:' || ref.referrer_id::text || ':' || (cycle_info ->> 'cycle_number'),
      'Bonus completamento ciclo referral #' || (cycle_info ->> 'cycle_number'),
      'referral', 'referral'
    );
  END IF;

  PERFORM public.recompute_referrer_pricing(ref.referrer_id);

  RETURN jsonb_build_object(
    'ok', true,
    'referral_id', ref.id,
    'referrer_id', ref.referrer_id,
    'cycle_number', cycle_info ->> 'cycle_number',
    'position_in_cycle', cycle_info ->> 'position_in_cycle',
    'level_credits', level_credits,
    'cycle_completed', cycle_completed,
    'bonus_credits', bonus_credits
  );
END;
$$;
REVOKE ALL ON FUNCTION public.activate_referral(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_referral(UUID, UUID) TO service_role;

-- Cancellazione (non rimborso): il referral smette di contare come attivo,
-- il prezzo del referrer viene ricalcolato, i crediti già erogati restano.
CREATE OR REPLACE FUNCTION public.cancel_referral(_referred_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref RECORD;
BEGIN
  SELECT * INTO ref FROM public.referrals WHERE referred_user_id = _referred_user_id FOR UPDATE;
  IF ref.id IS NULL OR ref.status <> 'ACTIVE' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_active');
  END IF;

  UPDATE public.referrals SET status = 'CANCELLED', cancelled_at = now() WHERE id = ref.id;
  PERFORM public.recompute_referrer_pricing(ref.referrer_id);

  RETURN jsonb_build_object('ok', true, 'referral_id', ref.id, 'referrer_id', ref.referrer_id);
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_referral(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_referral(UUID) TO service_role;

-- Rimborso/chargeback: a differenza della cancellazione, qui si stornano
-- anche i crediti erogati per QUESTO specifico referral (mai sotto zero: se
-- l'utente li ha già consumati, non si può recuperare ciò che è già speso,
-- ma si azzera comunque il residuo per non lasciare un vantaggio ottenuto con
-- un pagamento poi annullato). Non si toccano posizione/ciclo di altri
-- referral: la storia del ciclo non viene rinumerata retroattivamente.
CREATE OR REPLACE FUNCTION public.refund_referral(_referred_user_id UUID, _new_status TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref RECORD;
  clawback INTEGER;
BEGIN
  IF _new_status NOT IN ('REFUNDED', 'CHARGEBACK') THEN
    RAISE EXCEPTION 'stato non valido per refund_referral: %', _new_status;
  END IF;

  SELECT * INTO ref FROM public.referrals WHERE referred_user_id = _referred_user_id FOR UPDATE;
  IF ref.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_referral');
  END IF;

  clawback := COALESCE(ref.reward_credits, 0);
  IF clawback > 0 AND ref.status = 'ACTIVE' THEN
    UPDATE public.profiles
      SET bonus_credits_remaining = GREATEST(0, bonus_credits_remaining - clawback)
      WHERE id = ref.referrer_id;
    INSERT INTO public.credit_transactions (user_id, tool_id, operation_id, transaction_type, amount, source, description)
    VALUES (
      ref.referrer_id, 'referral', 'referral-clawback:' || ref.id::text, 'adjustment', -clawback, 'referral',
      'Storno crediti: referral rimborsato/chargeback'
    )
    ON CONFLICT (user_id, operation_id) DO NOTHING;
  END IF;

  UPDATE public.referrals SET status = _new_status, cancelled_at = now() WHERE id = ref.id;
  PERFORM public.recompute_referrer_pricing(ref.referrer_id);

  RETURN jsonb_build_object('ok', true, 'referral_id', ref.id, 'referrer_id', ref.referrer_id, 'credits_clawed_back', clawback);
END;
$$;
REVOKE ALL ON FUNCTION public.refund_referral(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_referral(UUID, TEXT) TO service_role;
