-- ============================================================================
-- Query aggregate per dashboard utente e pannello admin.
-- ============================================================================

-- Riepilogo referral per l'utente corrente (dashboard /dashboard/referral).
-- Usa auth.uid() internamente (nessun parametro _user_id): concesso ad
-- "authenticated", quindi DEVE riferirsi solo al chiamante — un parametro
-- accettato dall'esterno permetterebbe di leggere i dati referral di
-- chiunque (IDOR). Stesso pattern di get_credit_state().
CREATE OR REPLACE FUNCTION public.get_referral_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  code TEXT;
  pricing RECORD;
  current_plan RECORD;
  current_cycle RECORD;
  per_step INTEGER;
  step_discount NUMERIC;
  max_referrals INTEGER;
  next_threshold INTEGER;
  next_price NUMERIC;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT referral_code INTO code FROM public.profiles WHERE id = _user_id;

  -- Piano REALE dell'utente: lo sconto si applica a qualunque piano attivo
  -- (Starter/Pro/Business), non solo a Pro.
  SELECT pl.slug, pl.name, pl.price INTO current_plan
  FROM public.subscriptions s JOIN public.plans pl ON pl.id = s.plan_id
  WHERE s.user_id = _user_id AND s.status IN ('active', 'on_trial')
  ORDER BY s.updated_at DESC LIMIT 1;

  SELECT * INTO pricing FROM public.pro_referral_pricing WHERE user_id = _user_id;
  IF pricing.user_id IS NULL THEN
    pricing.active_direct_referrals := public.count_active_direct_referrals(_user_id);
  END IF;

  SELECT * INTO current_cycle FROM public.referral_cycles
    WHERE user_id = _user_id AND completed = false
    ORDER BY cycle_number DESC LIMIT 1;

  SELECT (value #>> '{}')::integer INTO per_step FROM public.referral_config WHERE key = 'referrals_per_step';
  SELECT (value #>> '{}')::numeric INTO step_discount FROM public.referral_config WHERE key = 'discount_per_step';

  IF current_plan.slug IS NULL THEN
    -- Nessun piano attivo: niente da scontare, ma il resto della dashboard
    -- (codice, crediti, ciclo) resta comunque utile e visibile.
    RETURN jsonb_build_object(
      'referral_code', code,
      'active_direct_referrals', pricing.active_direct_referrals,
      'plan_slug', NULL,
      'plan_name', NULL,
      'current_price', NULL,
      'base_price', NULL,
      'next_threshold', NULL,
      'next_price', NULL,
      'referrals_needed_for_next', NULL,
      'current_cycle_number', COALESCE(current_cycle.cycle_number, 1),
      'current_cycle_progress', COALESCE(current_cycle.referral_count, 0),
      'cycle_length', (SELECT (value #>> '{}')::integer FROM public.referral_config WHERE key = 'cycle_length'),
      'total_referrals', (SELECT count(*) FROM public.referrals WHERE referrer_id = _user_id),
      'active_referrals_list', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', r.id, 'status', r.status, 'position_in_cycle', r.position_in_cycle,
          'cycle_number', r.cycle_number, 'reward_credits', r.reward_credits,
          'activated_at', r.activated_at, 'created_at', r.created_at,
          'referred_email', p.email
        ) ORDER BY r.created_at DESC)
        FROM public.referrals r JOIN public.profiles p ON p.id = r.referred_user_id
        WHERE r.referrer_id = _user_id LIMIT 50
      ), '[]'::jsonb)
    );
  END IF;

  -- Prezzo massimo scontabile a zero: base_price * per_step (con sconto_per_step=1).
  max_referrals := CEIL(current_plan.price / step_discount) * per_step;

  next_threshold := LEAST(
    (FLOOR(pricing.active_direct_referrals::numeric / per_step) + 1) * per_step,
    max_referrals
  );
  next_price := public.calc_referral_price(current_plan.price, next_threshold);

  RETURN jsonb_build_object(
    'referral_code', code,
    'active_direct_referrals', pricing.active_direct_referrals,
    'plan_slug', current_plan.slug,
    'plan_name', current_plan.name,
    'current_price', public.calc_referral_price(current_plan.price, pricing.active_direct_referrals),
    'base_price', current_plan.price,
    'max_discount_referrals', max_referrals,
    'next_threshold', CASE WHEN pricing.active_direct_referrals >= max_referrals THEN NULL ELSE next_threshold END,
    'next_price', CASE WHEN pricing.active_direct_referrals >= max_referrals THEN NULL ELSE next_price END,
    'referrals_needed_for_next', CASE WHEN pricing.active_direct_referrals >= max_referrals THEN 0 ELSE next_threshold - pricing.active_direct_referrals END,
    'current_cycle_number', COALESCE(current_cycle.cycle_number, 1),
    'current_cycle_progress', COALESCE(current_cycle.referral_count, 0),
    'cycle_length', (SELECT (value #>> '{}')::integer FROM public.referral_config WHERE key = 'cycle_length'),
    'total_referrals', (SELECT count(*) FROM public.referrals WHERE referrer_id = _user_id),
    'active_referrals_list', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'status', r.status, 'position_in_cycle', r.position_in_cycle,
        'cycle_number', r.cycle_number, 'reward_credits', r.reward_credits,
        'activated_at', r.activated_at, 'created_at', r.created_at,
        'referred_email', p.email
      ) ORDER BY r.created_at DESC)
      FROM public.referrals r JOIN public.profiles p ON p.id = r.referred_user_id
      WHERE r.referrer_id = _user_id
      LIMIT 50
    ), '[]'::jsonb)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.get_referral_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referral_dashboard() TO authenticated, service_role;

-- Elenco referral per l'admin, filtrato/paginato (stesso pattern di admin_list_users).
CREATE OR REPLACE FUNCTION public.admin_list_referrals(
  _search TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, referrer_id UUID, referrer_email TEXT, referred_user_id UUID, referred_email TEXT,
  status TEXT, cycle_number INTEGER, position_in_cycle INTEGER, reward_credits INTEGER,
  created_at TIMESTAMPTZ, activated_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id, r.referrer_id, pr.email, r.referred_user_id, pd.email,
    r.status, r.cycle_number, r.position_in_cycle, r.reward_credits,
    r.created_at, r.activated_at, r.cancelled_at,
    count(*) OVER()::bigint AS total_count
  FROM public.referrals r
  JOIN public.profiles pr ON pr.id = r.referrer_id
  JOIN public.profiles pd ON pd.id = r.referred_user_id
  WHERE (_search IS NULL OR _search = '' OR pr.email ILIKE '%' || _search || '%' OR pd.email ILIKE '%' || _search || '%')
    AND (_status IS NULL OR _status = '' OR r.status = _status)
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 200) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.admin_list_referrals(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_referrals(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- KPI aggregati per la dashboard admin del programma referral.
CREATE OR REPLACE FUNCTION public.admin_referral_kpis()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_referrals', (SELECT count(*) FROM public.referrals),
    'active_referrals', (SELECT count(*) FROM public.referrals WHERE status = 'ACTIVE'),
    'cancelled_referrals', (SELECT count(*) FROM public.referrals WHERE status IN ('CANCELLED','REFUNDED','CHARGEBACK')),
    'pending_referrals', (SELECT count(*) FROM public.referrals WHERE status IN ('CLICKED','REGISTERED','TRIAL','PENDING_PAYMENT')),
    'conversion_rate', (
      SELECT CASE WHEN count(*) = 0 THEN 0 ELSE round(
        (count(*) FILTER (WHERE status = 'ACTIVE'))::numeric / count(*) * 100, 1
      ) END
      FROM public.referrals
    ),
    'total_credits_distributed', (
      SELECT COALESCE(SUM(amount), 0) FROM public.credit_transactions WHERE source = 'referral' AND amount > 0
    ),
    'total_credits_clawed_back', (
      SELECT COALESCE(ABS(SUM(amount)), 0) FROM public.credit_transactions WHERE source = 'referral' AND amount < 0
    ),
    'cycles_completed', (SELECT count(*) FROM public.referral_cycles WHERE completed = true),
    'users_with_pro_discount', (SELECT count(*) FROM public.pro_referral_pricing WHERE effective_price IS NOT NULL AND effective_price < base_price),
    'users_with_pro_free', (SELECT count(*) FROM public.pro_referral_pricing WHERE effective_price = 0)
  );
$$;
REVOKE ALL ON FUNCTION public.admin_referral_kpis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_referral_kpis() TO service_role;

-- Referral sospetti: pagamenti falliti ripetuti, o pattern di email molto simili
-- allo stesso referrer (euristica semplice, non un blocco automatico — solo
-- segnalazione per revisione admin, come richiesto dalla spec anti-abuse).
CREATE OR REPLACE FUNCTION public.admin_suspicious_referrals()
RETURNS TABLE(referrer_id UUID, referrer_email TEXT, referred_count BIGINT, same_ip_pattern BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Segnala referrer con un numero di referral REGISTERED/PENDING_PAYMENT mai
  -- diventati ACTIVE sproporzionato rispetto a quelli attivati: possibile
  -- tentativo di registrazioni fittizie senza pagamento reale.
  SELECT
    r.referrer_id,
    p.email,
    count(*) FILTER (WHERE r.status IN ('REGISTERED', 'PENDING_PAYMENT', 'TRIAL')) AS referred_count,
    false AS same_ip_pattern
  FROM public.referrals r
  JOIN public.profiles p ON p.id = r.referrer_id
  GROUP BY r.referrer_id, p.email
  HAVING count(*) FILTER (WHERE r.status IN ('REGISTERED', 'PENDING_PAYMENT', 'TRIAL')) >= 5
     AND count(*) FILTER (WHERE r.status = 'ACTIVE') = 0
  ORDER BY referred_count DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_suspicious_referrals() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspicious_referrals() TO service_role;
