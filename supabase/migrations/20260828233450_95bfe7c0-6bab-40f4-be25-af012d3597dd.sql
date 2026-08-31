-- 1. Nuovi prezzi e limiti
UPDATE public.plans SET price = 35, monthly_limit = 300 WHERE slug = 'pro';
UPDATE public.plans SET price = 99 WHERE slug = 'business';

-- 2. Tool inclusi per piano
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS allowed_tools TEXT[] NOT NULL
  DEFAULT ARRAY['copertine','pubblicazione','aplus','triage']::TEXT[];

UPDATE public.plans SET allowed_tools = ARRAY['copertine','pubblicazione','triage']::TEXT[] WHERE slug = 'starter';
UPDATE public.plans SET allowed_tools = ARRAY['copertine','pubblicazione','aplus','triage']::TEXT[] WHERE slug IN ('pro','business');

-- 3. get_credit_state espone i tool consentiti
CREATE OR REPLACE FUNCTION public.get_credit_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      'remaining', 0, 'status', 'none', 'allowed_tools', '[]'::jsonb
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
    'allowed_tools', to_jsonb(COALESCE(pl.allowed_tools, ARRAY[]::TEXT[])),
    'current_period_start', sub.current_period_start,
    'current_period_end', sub.current_period_end,
    'cancelled_at', sub.cancelled_at,
    'subscription_id', sub.id
  );
END;
$function$;

-- 4. consume_credit rifiuta tool non inclusi nel piano
CREATE OR REPLACE FUNCTION public.consume_credit(_tool_id text, _operation_id text, _description text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE user_id = uid
    ORDER BY (status IN ('active','on_trial')) DESC, updated_at DESC LIMIT 1
    FOR UPDATE;

  IF sub.id IS NULL OR sub.status NOT IN ('active','on_trial') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'subscription_inactive');
  END IF;

  SELECT * INTO pl FROM public.plans WHERE id = sub.plan_id;

  IF pl.id IS NULL OR NOT (_tool_id = ANY(COALESCE(pl.allowed_tools, ARRAY[]::TEXT[]))) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tool_not_in_plan', 'plan', pl.slug);
  END IF;

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
$function$;