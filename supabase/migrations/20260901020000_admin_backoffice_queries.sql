-- ============================================================================
-- BACK OFFICE ADMIN — query paginate/filtrate lato server (mai caricare intere
-- tabelle nel browser). Ordinamento reso sicuro con un allowlist di colonne +
-- format(%s) solo su valori già validati, mai su input utente grezzo.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_users(
  _search TEXT DEFAULT NULL,
  _role TEXT DEFAULT NULL,
  _plan_slug TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _sort TEXT DEFAULT 'created_at',
  _sort_dir TEXT DEFAULT 'desc',
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  banned_until TIMESTAMPTZ,
  admin_role TEXT,
  admin_suspended BOOLEAN,
  plan_slug TEXT,
  plan_name TEXT,
  plan_price NUMERIC,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sort_col TEXT;
  safe_dir TEXT;
  safe_limit INTEGER := LEAST(GREATEST(COALESCE(_limit, 25), 1), 200);
  safe_offset INTEGER := GREATEST(COALESCE(_offset, 0), 0);
BEGIN
  sort_col := CASE _sort
    WHEN 'name' THEN 'p.name'
    WHEN 'email' THEN 'p.email'
    WHEN 'last_sign_in_at' THEN 'u.last_sign_in_at'
    ELSE 'p.created_at'
  END;
  safe_dir := CASE WHEN lower(COALESCE(_sort_dir, 'desc')) = 'asc' THEN 'ASC' ELSE 'DESC' END;

  RETURN QUERY EXECUTE format(
    $q$
    SELECT
      p.id, p.email, p.name, p.avatar, p.created_at,
      u.last_sign_in_at, u.banned_until,
      ar.role, COALESCE(ar.suspended, false),
      pl.slug, pl.name, pl.price,
      s.status, s.current_period_end,
      count(*) OVER()::bigint AS total_count
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.admin_roles ar ON ar.user_id = p.id
    LEFT JOIN LATERAL (
      SELECT * FROM public.subscriptions s2
      WHERE s2.user_id = p.id
      ORDER BY (s2.status IN ('active','on_trial')) DESC, s2.updated_at DESC
      LIMIT 1
    ) s ON true
    LEFT JOIN public.plans pl ON pl.id = s.plan_id
    WHERE ($1 IS NULL OR $1 = '' OR p.email ILIKE '%%' || $1 || '%%' OR p.name ILIKE '%%' || $1 || '%%')
      AND ($2 IS NULL OR $2 = '' OR COALESCE(ar.role, 'user') = $2)
      AND ($3 IS NULL OR $3 = '' OR ($3 = 'none' AND pl.slug IS NULL) OR pl.slug = $3)
      AND ($4 IS NULL OR $4 = '' OR s.status = $4)
    ORDER BY %s %s NULLS LAST
    LIMIT $5 OFFSET $6
    $q$,
    sort_col, safe_dir
  ) USING _search, _role, _plan_slug, _status, safe_limit, safe_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- Dettaglio singolo utente: profilo + ruolo admin + abbonamento + dati auth essenziali.
CREATE OR REPLACE FUNCTION public.admin_get_user_detail(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', to_jsonb(p.*),
    'auth', jsonb_build_object(
      'last_sign_in_at', u.last_sign_in_at,
      'banned_until', u.banned_until,
      'email_confirmed_at', u.email_confirmed_at,
      'created_at', u.created_at
    ),
    'admin_role', ar.role,
    'admin_suspended', COALESCE(ar.suspended, false),
    'subscriptions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'status', s.status, 'plan_slug', pl.slug, 'plan_name', pl.name,
        'plan_price', pl.price, 'current_period_start', s.current_period_start,
        'current_period_end', s.current_period_end, 'cancelled_at', s.cancelled_at,
        'credits_used', s.credits_used, 'lemon_squeezy_subscription_id', s.lemon_squeezy_subscription_id,
        'created_at', s.created_at
      ) ORDER BY s.created_at DESC)
      FROM public.subscriptions s LEFT JOIN public.plans pl ON pl.id = s.plan_id
      WHERE s.user_id = _user_id
    ), '[]'::jsonb),
    'payments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', pay.id, 'amount', pay.amount, 'currency', pay.currency, 'status', pay.status,
        'provider', pay.provider, 'description', pay.description, 'created_at', pay.created_at
      ) ORDER BY pay.created_at DESC)
      FROM public.payments pay WHERE pay.user_id = _user_id LIMIT 50
    ), '[]'::jsonb),
    'recent_activity', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'tool_id', ct.tool_id, 'amount', ct.amount, 'source', ct.source,
        'description', ct.description, 'created_at', ct.created_at
      ) ORDER BY ct.created_at DESC)
      FROM public.credit_transactions ct WHERE ct.user_id = _user_id
      ORDER BY ct.created_at DESC LIMIT 50
    ), '[]'::jsonb)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.admin_roles ar ON ar.user_id = p.id
  WHERE p.id = _user_id;

  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_get_user_detail(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_detail(UUID) TO service_role;

-- Elenco abbonamenti filtrato/paginato.
CREATE OR REPLACE FUNCTION public.admin_list_subscriptions(
  _search TEXT DEFAULT NULL,
  _plan_slug TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, user_id UUID, user_email TEXT, user_name TEXT,
  plan_slug TEXT, plan_name TEXT, plan_price NUMERIC,
  status TEXT, current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ, created_at TIMESTAMPTZ, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.user_id, p.email, p.name,
    pl.slug, pl.name, pl.price,
    s.status, s.current_period_start, s.current_period_end,
    s.cancelled_at, s.created_at,
    count(*) OVER()::bigint AS total_count
  FROM public.subscriptions s
  JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.plans pl ON pl.id = s.plan_id
  WHERE (_search IS NULL OR _search = '' OR p.email ILIKE '%' || _search || '%' OR p.name ILIKE '%' || _search || '%')
    AND (_plan_slug IS NULL OR _plan_slug = '' OR pl.slug = _plan_slug)
    AND (_status IS NULL OR _status = '' OR s.status = _status)
  ORDER BY s.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 200) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.admin_list_subscriptions(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_subscriptions(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- Elenco pagamenti filtrato/paginato (usato sia per la tabella sia per l'export CSV,
-- con _limit più alto e senza offset in quel caso, fino a un tetto di sicurezza).
CREATE OR REPLACE FUNCTION public.admin_list_payments(
  _search TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _from TIMESTAMPTZ DEFAULT NULL,
  _to TIMESTAMPTZ DEFAULT NULL,
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, user_id UUID, user_email TEXT, user_name TEXT,
  amount NUMERIC, currency TEXT, status TEXT, provider TEXT,
  provider_payment_id TEXT, provider_order_id TEXT, plan_slug TEXT,
  description TEXT, created_at TIMESTAMPTZ, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pay.id, pay.user_id, p.email, p.name,
    pay.amount, pay.currency, pay.status, pay.provider,
    pay.provider_payment_id, pay.provider_order_id, pay.plan_slug,
    pay.description, pay.created_at,
    count(*) OVER()::bigint AS total_count
  FROM public.payments pay
  LEFT JOIN public.profiles p ON p.id = pay.user_id
  WHERE (_search IS NULL OR _search = '' OR p.email ILIKE '%' || _search || '%' OR pay.provider_payment_id ILIKE '%' || _search || '%' OR pay.provider_order_id ILIKE '%' || _search || '%')
    AND (_status IS NULL OR _status = '' OR pay.status = _status)
    AND (_from IS NULL OR pay.created_at >= _from)
    AND (_to IS NULL OR pay.created_at <= _to)
  ORDER BY pay.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 10000) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.admin_list_payments(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_payments(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) TO service_role;

-- Ricerca globale (utenti, abbonamenti, pagamenti) in un'unica chiamata.
CREATE OR REPLACE FUNCTION public.admin_global_search(_query TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'users', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'email', p.email, 'name', p.name))
      FROM (
        SELECT id, email, name FROM public.profiles
        WHERE email ILIKE '%' || _query || '%' OR name ILIKE '%' || _query || '%' OR id::text = _query
        LIMIT 8
      ) p
    ), '[]'::jsonb),
    'subscriptions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', s.id, 'user_email', p.email, 'status', s.status))
      FROM (
        SELECT * FROM public.subscriptions
        WHERE id::text = _query OR lemon_squeezy_subscription_id ILIKE '%' || _query || '%'
        LIMIT 8
      ) s
      JOIN public.profiles p ON p.id = s.user_id
    ), '[]'::jsonb),
    'payments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', pay.id, 'user_email', p.email, 'amount', pay.amount, 'status', pay.status))
      FROM (
        SELECT * FROM public.payments
        WHERE id::text = _query OR provider_payment_id ILIKE '%' || _query || '%' OR provider_order_id ILIKE '%' || _query || '%'
        LIMIT 8
      ) pay
      LEFT JOIN public.profiles p ON p.id = pay.user_id
    ), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.admin_global_search(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_global_search(TEXT) TO service_role;

-- Analytics aggiuntive: conversione trial->paid, ARPU, retention approssimata su base mensile.
CREATE OR REPLACE FUNCTION public.admin_analytics_summary()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'arpu', (
      SELECT CASE WHEN count(*) = 0 THEN 0 ELSE round(COALESCE(SUM(pl.price), 0) / count(*), 2) END
      FROM public.subscriptions s JOIN public.plans pl ON pl.id = s.plan_id
      WHERE s.status = 'active'
    ),
    'trial_to_paid_30d', (
      SELECT jsonb_build_object(
        'trials_started', (SELECT count(*) FROM public.subscriptions WHERE created_at >= now() - interval '30 days'),
        'converted', (SELECT count(*) FROM public.subscriptions WHERE created_at >= now() - interval '30 days' AND status = 'active' AND credits_used > 0)
      )
    ),
    'churn_30d', (
      SELECT CASE WHEN base = 0 THEN 0 ELSE round((cancelled::numeric / base) * 100, 1) END
      FROM (
        SELECT
          (SELECT count(*) FROM public.subscriptions WHERE status IN ('active','on_trial')) AS base,
          (SELECT count(*) FROM public.subscriptions WHERE cancelled_at >= now() - interval '30 days') AS cancelled
      ) x
    )
  );
$$;
REVOKE ALL ON FUNCTION public.admin_analytics_summary() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_analytics_summary() TO service_role;
