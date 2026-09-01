-- ============================================================================
-- Funzioni di scrittura per lead e disiscrizione. Chiamate solo da server
-- function (supabaseAdmin), mai direttamente dal client: nessun grant a
-- anon/authenticated, stesso pattern di ensure_referral_code.
-- ============================================================================

-- Upsert di un contatto dalla landing page. Ogni chiamata (anche ripetuta con
-- la stessa email) registra/rinnova esplicitamente il consenso al marketing
-- con timestamp aggiornato — richiesto per poter dimostrare il consenso GDPR.
CREATE OR REPLACE FUNCTION public.capture_lead(
  _email TEXT,
  _name TEXT DEFAULT NULL,
  _locale TEXT DEFAULT NULL,
  _source TEXT DEFAULT 'landing_newsletter'
)
RETURNS public.leads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.leads;
BEGIN
  INSERT INTO public.leads (email, name, locale, source, marketing_consent, consented_at, status)
  VALUES (
    lower(trim(_email)),
    NULLIF(trim(_name), ''),
    _locale,
    COALESCE(_source, 'landing_newsletter'),
    true,
    now(),
    'subscribed'
  )
  ON CONFLICT (email) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.leads.name),
    locale = COALESCE(EXCLUDED.locale, public.leads.locale),
    marketing_consent = true,
    consented_at = now(),
    status = 'subscribed'
  RETURNING * INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_lead(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_lead(TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Collega un lead all'account utente creato in seguito con la stessa email:
-- permette di misurare il tasso di conversione lead → abbonato. Best-effort,
-- non blocca né altera il flusso di registrazione se non trova corrispondenza.
CREATE OR REPLACE FUNCTION public.link_lead_to_user(_email TEXT, _user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leads
  SET converted_user_id = _user_id
  WHERE lower(email) = lower(_email) AND converted_user_id IS NULL;
$$;
REVOKE ALL ON FUNCTION public.link_lead_to_user(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_lead_to_user(TEXT, UUID) TO service_role;

-- Disiscrizione via token (dal link in fondo alle email promozionali): cerca
-- prima tra i lead poi tra gli abbonati registrati, idempotente (richiamarla
-- due volte sullo stesso token non è un errore). Ritorna quale dei due casi
-- ha trovato, o 'not_found' se il token non corrisponde a nulla.
CREATE OR REPLACE FUNCTION public.process_unsubscribe(_token UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  IF _token IS NULL THEN RETURN 'not_found'; END IF;

  UPDATE public.leads SET status = 'unsubscribed' WHERE unsubscribe_token = _token AND status <> 'unsubscribed';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected > 0 OR EXISTS (SELECT 1 FROM public.leads WHERE unsubscribe_token = _token) THEN
    RETURN 'lead';
  END IF;

  UPDATE public.profiles SET marketing_opt_out = true WHERE email_unsubscribe_token = _token;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected > 0 OR EXISTS (SELECT 1 FROM public.profiles WHERE email_unsubscribe_token = _token) THEN
    RETURN 'profile';
  END IF;

  RETURN 'not_found';
END;
$$;
REVOKE ALL ON FUNCTION public.process_unsubscribe(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_unsubscribe(UUID) TO service_role;
