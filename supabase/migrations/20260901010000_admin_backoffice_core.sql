-- ============================================================================
-- BACK OFFICE ADMIN — schema di base
-- ============================================================================
-- Il ruolo admin NON viene aggiunto a public.profiles: quella tabella ha una
-- policy "profiles_update_own" che permette all'utente di aggiornare la
-- propria riga (mass-assignment risk se il ruolo vivesse lì). Il ruolo admin
-- vive in una tabella separata, senza alcuna grant di scrittura per
-- "authenticated": può essere scritta solo da service_role (quindi solo dal
-- backend, mai direttamente dal client).

CREATE TABLE public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'support', 'admin', 'super_admin')),
  suspended BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID REFERENCES auth.users ON DELETE SET NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX admin_roles_role_idx ON public.admin_roles (role);
GRANT SELECT ON public.admin_roles TO authenticated;
GRANT ALL ON public.admin_roles TO service_role;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
-- Un utente può leggere solo la propria riga (per sapere se è admin), non le altre.
CREATE POLICY "admin_roles_select_own" ON public.admin_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER admin_roles_touch BEFORE UPDATE ON public.admin_roles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PAYMENTS — ledger dei pagamenti reali (nessuna tabella equivalente esisteva:
-- il webhook Lemon Squeezy aggiornava solo lo stato di subscriptions, senza
-- conservare uno storico delle singole transazioni).
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'lemon_squeezy',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  plan_slug TEXT,
  amount NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded', 'cancelled')),
  description TEXT,
  raw_event TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payments_provider_payment_unique ON public.payments (provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE INDEX payments_user_idx ON public.payments (user_id);
CREATE INDEX payments_status_idx ON public.payments (status);
CREATE INDEX payments_created_idx ON public.payments (created_at DESC);
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated/anon: letto/scritto solo dal backend (server functions + webhook) con service_role.

-- AUDIT LOGS — append-only, mai modificabile da codice applicativo "normale".
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  result TEXT NOT NULL DEFAULT 'success' CHECK (result IN ('success', 'failure')),
  ip TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_admin_idx ON public.audit_logs (admin_id);
CREATE INDEX audit_logs_target_idx ON public.audit_logs (target_type, target_id);
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated/anon: scritto solo da server functions (service_role) e mai
-- esposto a UPDATE/DELETE da codice applicativo (nessuna funzione li espone).

-- FEATURE FLAGS
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_for_all BOOLEAN NOT NULL DEFAULT false,
  enabled_plans TEXT[] NOT NULL DEFAULT '{}',
  enabled_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
-- Lettura pubblica per utenti autenticati (serve a valutare i flag lato server per qualunque utente),
-- scrittura riservata al backend admin.
CREATE POLICY "feature_flags_select_all" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE TRIGGER feature_flags_touch BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SYSTEM SETTINGS — key/value, mai secret in chiaro (solo configurazione non sensibile).
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated/anon: le impostazioni SaaS pubbliche rilevanti (nome, logo, ecc.)
-- vengono servite da una server function dedicata, non da una query diretta del client.

-- ADMIN NOTIFICATIONS
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_by UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX admin_notifications_created_idx ON public.admin_notifications (created_at DESC);
GRANT ALL ON public.admin_notifications TO service_role;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated/anon: lette tramite server function che verifica il ruolo admin.

-- ============================================================================
-- Funzioni di supporto
-- ============================================================================

-- Ruolo dell'utente corrente (NULL = utente normale, nessuna riga in admin_roles).
CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.admin_roles WHERE user_id = auth.uid() AND suspended = false;
$$;
GRANT EXECUTE ON FUNCTION public.current_admin_role() TO authenticated, service_role;

-- Bootstrap idempotente del SUPER_ADMIN principale: la email è passata dal
-- server (letta da SUPER_ADMIN_EMAIL, mai hardcodata qui) e la funzione è
-- eseguibile solo da service_role, quindi mai direttamente dal client.
CREATE OR REPLACE FUNCTION public.ensure_super_admin(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_roles (user_id, role, suspended)
  VALUES (_user_id, 'super_admin', false)
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'super_admin', suspended = false
    WHERE public.admin_roles.role IS DISTINCT FROM 'super_admin' OR public.admin_roles.suspended = true;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_super_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_super_admin(UUID) TO service_role;

-- KPI dashboard admin: un'unica query aggregata invece di caricare intere tabelle lato client.
CREATE OR REPLACE FUNCTION public.admin_dashboard_kpis()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles),
    'new_users_7d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '7 days'),
    'new_users_30d', (SELECT count(*) FROM public.profiles WHERE created_at >= now() - interval '30 days'),
    'active_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status IN ('active', 'on_trial')),
    'trial_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status = 'on_trial'),
    'trial_ending_7d', (SELECT count(*) FROM public.subscriptions WHERE status = 'on_trial' AND current_period_end IS NOT NULL AND current_period_end <= now() + interval '7 days'),
    'cancelled_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status = 'cancelled'),
    'past_due_subscriptions', (SELECT count(*) FROM public.subscriptions WHERE status = 'past_due'),
    'free_users', (SELECT count(*) FROM public.profiles p WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id AND s.status IN ('active', 'on_trial'))),
    'paying_users', (SELECT count(DISTINCT user_id) FROM public.subscriptions WHERE status IN ('active', 'on_trial')),
    'mrr', (
      SELECT COALESCE(SUM(pl.price), 0)
      FROM public.subscriptions s JOIN public.plans pl ON pl.id = s.plan_id
      WHERE s.status = 'active'
    ),
    'failed_payments_30d', (SELECT count(*) FROM public.payments WHERE status = 'failed' AND created_at >= now() - interval '30 days'),
    'revenue_30d', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'succeeded' AND created_at >= now() - interval '30 days')
  );
$$;
REVOKE ALL ON FUNCTION public.admin_dashboard_kpis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_kpis() TO service_role;

-- Serie giornaliera nuovi utenti (per grafico "crescita utenti"), su una finestra di N giorni.
CREATE OR REPLACE FUNCTION public.admin_users_growth(_days INTEGER DEFAULT 30)
RETURNS TABLE(day DATE, new_users BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d::date AS day, COUNT(p.id) AS new_users
  FROM generate_series(now() - (_days || ' days')::interval, now(), interval '1 day') d
  LEFT JOIN public.profiles p ON date_trunc('day', p.created_at) = date_trunc('day', d)
  GROUP BY d
  ORDER BY d;
$$;
REVOKE ALL ON FUNCTION public.admin_users_growth(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_users_growth(INTEGER) TO service_role;

-- Serie giornaliera revenue riconosciuta (pagamenti succeeded), su una finestra di N giorni.
CREATE OR REPLACE FUNCTION public.admin_revenue_series(_days INTEGER DEFAULT 30)
RETURNS TABLE(day DATE, revenue NUMERIC, payments_count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d::date AS day,
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'succeeded'), 0) AS revenue,
    COUNT(pay.id) FILTER (WHERE pay.status = 'succeeded') AS payments_count
  FROM generate_series(now() - (_days || ' days')::interval, now(), interval '1 day') d
  LEFT JOIN public.payments pay ON date_trunc('day', pay.created_at) = date_trunc('day', d)
  GROUP BY d
  ORDER BY d;
$$;
REVOKE ALL ON FUNCTION public.admin_revenue_series(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revenue_series(INTEGER) TO service_role;

-- Distribuzione utenti attivi per piano (per grafico a torta).
CREATE OR REPLACE FUNCTION public.admin_plan_distribution()
RETURNS TABLE(plan_slug TEXT, plan_name TEXT, subscribers BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pl.slug, pl.name, COUNT(s.id)
  FROM public.plans pl
  LEFT JOIN public.subscriptions s ON s.plan_id = pl.id AND s.status IN ('active', 'on_trial')
  GROUP BY pl.slug, pl.name, pl.sort_order
  ORDER BY pl.sort_order;
$$;
REVOKE ALL ON FUNCTION public.admin_plan_distribution() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_plan_distribution() TO service_role;

-- Nuovi abbonamenti vs cancellazioni per giorno.
CREATE OR REPLACE FUNCTION public.admin_subscription_events_series(_days INTEGER DEFAULT 30)
RETURNS TABLE(day DATE, new_subscriptions BIGINT, cancellations BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d::date AS day,
    COUNT(s.id) FILTER (WHERE date_trunc('day', s.created_at) = date_trunc('day', d)) AS new_subscriptions,
    COUNT(s.id) FILTER (WHERE date_trunc('day', s.cancelled_at) = date_trunc('day', d)) AS cancellations
  FROM generate_series(now() - (_days || ' days')::interval, now(), interval '1 day') d
  LEFT JOIN public.subscriptions s
    ON date_trunc('day', s.created_at) = date_trunc('day', d)
    OR date_trunc('day', s.cancelled_at) = date_trunc('day', d)
  GROUP BY d
  ORDER BY d;
$$;
REVOKE ALL ON FUNCTION public.admin_subscription_events_series(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_subscription_events_series(INTEGER) TO service_role;

-- DAU/WAU/MAU basati sulla tabella usage (ultimo utilizzo di un tool = "attivo" in quel giorno).
CREATE OR REPLACE FUNCTION public.admin_active_users_counts()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'dau', (SELECT count(DISTINCT user_id) FROM public.usage WHERE updated_at >= now() - interval '1 day'),
    'wau', (SELECT count(DISTINCT user_id) FROM public.usage WHERE updated_at >= now() - interval '7 days'),
    'mau', (SELECT count(DISTINCT user_id) FROM public.usage WHERE updated_at >= now() - interval '30 days')
  );
$$;
REVOKE ALL ON FUNCTION public.admin_active_users_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_active_users_counts() TO service_role;
