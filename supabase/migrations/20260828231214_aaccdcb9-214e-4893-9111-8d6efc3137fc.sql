-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar TEXT,
  bonus_credits_remaining INTEGER NOT NULL DEFAULT 0,
  starter_bonus_granted BOOLEAN NOT NULL DEFAULT false,
  starter_bonus_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PLANS
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC(10,2) NOT NULL,
  monthly_limit INTEGER,
  unlimited BOOLEAN NOT NULL DEFAULT false,
  lemon_squeezy_variant_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (active = true);

INSERT INTO public.plans (name, slug, price, monthly_limit, unlimited, sort_order) VALUES
  ('Starter', 'starter', 15, 50, false, 1),
  ('Pro', 'pro', 20, 250, false, 2),
  ('Business', 'business', 25, NULL, true, 3);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans,
  lemon_squeezy_subscription_id TEXT UNIQUE,
  lemon_squeezy_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  credits_used INTEGER NOT NULL DEFAULT 0,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions (user_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- USAGE
CREATE TABLE public.usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions ON DELETE SET NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usage_unique_period ON public.usage (user_id, tool_id, COALESCE(period_start, '1970-01-01'::timestamptz));
GRANT SELECT ON public.usage TO authenticated;
GRANT ALL ON public.usage TO service_role;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_select_own" ON public.usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- CREDIT TRANSACTIONS
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions ON DELETE SET NULL,
  tool_id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'usage',
  amount INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'plan',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX credit_tx_operation_unique ON public.credit_transactions (user_id, operation_id);
CREATE INDEX credit_tx_user_created_idx ON public.credit_transactions (user_id, created_at DESC);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_tx_select_own" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER plans_touch BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER usage_touch BEFORE UPDATE ON public.usage FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CREDIT STATE
CREATE OR REPLACE FUNCTION public.get_credit_state()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  sub RECORD;
  pl RECORD;
  prof RECORD;
  base_remaining INTEGER := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO prof FROM public.profiles WHERE id = uid;
  SELECT * INTO sub FROM public.subscriptions
    WHERE user_id = uid
    ORDER BY (status IN ('active','on_trial','past_due')) DESC, updated_at DESC LIMIT 1;

  IF sub.id IS NULL THEN
    RETURN jsonb_build_object(
      'has_subscription', false, 'active', false, 'plan', NULL,
      'unlimited', false, 'limit', 0, 'used', 0, 'bonus_remaining', COALESCE(prof.bonus_credits_remaining, 0),
      'remaining', 0, 'status', 'none'
    );
  END IF;

  SELECT * INTO pl FROM public.plans WHERE id = sub.plan_id;
  IF pl.unlimited THEN
    base_remaining := -1;
  ELSE
    base_remaining := GREATEST(COALESCE(pl.monthly_limit, 0) - sub.credits_used, 0);
  END IF;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'active', sub.status IN ('active','on_trial'),
    'status', sub.status,
    'plan', jsonb_build_object('slug', pl.slug, 'name', pl.name, 'price', pl.price),
    'unlimited', COALESCE(pl.unlimited, false),
    'limit', COALESCE(pl.monthly_limit, 0) + CASE WHEN COALESCE(prof.bonus_credits_remaining,0) > 0 THEN prof.bonus_credits_remaining ELSE 0 END,
    'used', sub.credits_used,
    'bonus_remaining', COALESCE(prof.bonus_credits_remaining, 0),
    'remaining', CASE WHEN pl.unlimited THEN -1 ELSE base_remaining + COALESCE(prof.bonus_credits_remaining, 0) END,
    'current_period_start', sub.current_period_start,
    'current_period_end', sub.current_period_end,
    'cancelled_at', sub.cancelled_at,
    'subscription_id', sub.id
  );
END;
$$;

-- ATOMIC CONSUME
CREATE OR REPLACE FUNCTION public.consume_credit(_tool_id TEXT, _operation_id TEXT, _description TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  sub RECORD;
  pl RECORD;
  prof RECORD;
  existing RECORD;
  used_source TEXT := 'plan';
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _operation_id IS NULL OR length(trim(_operation_id)) = 0 THEN RAISE EXCEPTION 'operation_id required'; END IF;

  SELECT * INTO existing FROM public.credit_transactions WHERE user_id = uid AND operation_id = _operation_id;
  IF existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'state', public.get_credit_state());
  END IF;

  SELECT * INTO sub FROM public.subscriptions
    WHERE user_id = uid FOR UPDATE;
  SELECT * INTO sub FROM public.subscriptions
    WHERE user_id = uid
    ORDER BY (status IN ('active','on_trial')) DESC, updated_at DESC LIMIT 1
    FOR UPDATE;

  IF sub.id IS NULL OR sub.status NOT IN ('active','on_trial') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'subscription_inactive');
  END IF;

  SELECT * INTO pl FROM public.plans WHERE id = sub.plan_id;
  SELECT * INTO prof FROM public.profiles WHERE id = uid FOR UPDATE;

  IF COALESCE(pl.unlimited, false) THEN
    used_source := 'unlimited';
  ELSIF COALESCE(prof.bonus_credits_remaining, 0) > 0 THEN
    used_source := 'bonus';
    UPDATE public.profiles
      SET bonus_credits_remaining = bonus_credits_remaining - 1,
          starter_bonus_used = true
      WHERE id = uid;
  ELSIF sub.credits_used < COALESCE(pl.monthly_limit, 0) THEN
    used_source := 'plan';
    UPDATE public.subscriptions SET credits_used = credits_used + 1 WHERE id = sub.id;
  ELSE
    RETURN jsonb_build_object('ok', false, 'reason', 'limit_reached', 'plan', pl.slug);
  END IF;

  INSERT INTO public.credit_transactions (user_id, subscription_id, tool_id, operation_id, transaction_type, amount, source, description)
  VALUES (uid, sub.id, _tool_id, _operation_id, 'usage', CASE WHEN used_source = 'unlimited' THEN 0 ELSE -1 END, used_source, _description);

  INSERT INTO public.usage (user_id, tool_id, subscription_id, usage_count, period_start, period_end)
  VALUES (uid, _tool_id, sub.id, 1, sub.current_period_start, sub.current_period_end)
  ON CONFLICT (user_id, tool_id, COALESCE(period_start, '1970-01-01'::timestamptz))
  DO UPDATE SET usage_count = public.usage.usage_count + 1, updated_at = now();

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'source', used_source, 'state', public.get_credit_state());
END;
$$;

-- STARTER BONUS (once per user, server-side only)
CREATE OR REPLACE FUNCTION public.grant_starter_bonus(_user_id UUID, _amount INTEGER DEFAULT 50)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE granted BOOLEAN;
BEGIN
  SELECT starter_bonus_granted INTO granted FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF granted IS DISTINCT FROM false THEN RETURN false; END IF;
  UPDATE public.profiles
    SET starter_bonus_granted = true,
        bonus_credits_remaining = bonus_credits_remaining + _amount
    WHERE id = _user_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_starter_bonus(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_starter_bonus(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_credit_state() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_credit(TEXT, TEXT, TEXT) TO authenticated, service_role;