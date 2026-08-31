-- Aggiunge il supporto per l'acquisto una tantum di pacchetti di crediti (es. 10 crediti extra),
-- riusando il meccanismo "bonus_credits_remaining" già esistente per il bonus Starter: i crediti
-- acquistati NON scadono a fine periodo e vengono consumati PRIMA del monte crediti del piano
-- (stessa priorità già implementata in consume_credit). Nessuna modifica a consume_credit o
-- get_credit_state: entrambe già leggono/scrivono bonus_credits_remaining correttamente.

CREATE OR REPLACE FUNCTION public.add_purchased_credits(
  _user_id UUID,
  _amount INTEGER,
  _operation_id TEXT,
  _description TEXT DEFAULT NULL
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

  -- Idempotenza: un ordine Lemon Squeezy può arrivare più volte (retry del webhook).
  SELECT * INTO existing FROM public.credit_transactions WHERE user_id = _user_id AND operation_id = _operation_id;
  IF existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'duplicate', true);
  END IF;

  UPDATE public.profiles SET bonus_credits_remaining = bonus_credits_remaining + _amount WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found for user %', _user_id; END IF;

  INSERT INTO public.credit_transactions (user_id, tool_id, operation_id, transaction_type, amount, source, description)
  VALUES (_user_id, 'credit_pack', _operation_id, 'purchase', _amount, 'purchase', _description);

  RETURN jsonb_build_object('ok', true, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.add_purchased_credits(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_purchased_credits(UUID, INTEGER, TEXT, TEXT) TO service_role;
