-- Trova l'id utente da un'email (serve per aggiungere un amministratore: l'account deve già
-- esistere, non lo creiamo qui — l'admin si registra normalmente e poi viene promosso).
CREATE OR REPLACE FUNCTION public.admin_find_user_id_by_email(_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.admin_find_user_id_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_find_user_id_by_email(TEXT) TO service_role;

-- Valutazione feature flag, verificabile anche lato server da qualunque tool (non solo dal back
-- office): abilitata globalmente, per piano dell'utente, oppure per singolo utente.
CREATE OR REPLACE FUNCTION public.is_feature_enabled(_key TEXT, _user_id UUID DEFAULT NULL, _plan_slug TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT ff.enabled AND (
      ff.enabled_for_all
      OR (_plan_slug IS NOT NULL AND _plan_slug = ANY(ff.enabled_plans))
      OR (_user_id IS NOT NULL AND _user_id = ANY(ff.enabled_user_ids))
    )
    FROM public.feature_flags ff
    WHERE ff.key = _key
  ), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, UUID, TEXT) TO authenticated, service_role;

-- Stato di salute del sistema: latenza DB reale (round-trip di una query minima) + presenza
-- configurazione dei provider esterni (mai i valori, solo booleani "configurato/non configurato").
CREATE OR REPLACE FUNCTION public.admin_db_ping()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('ok', true, 'server_time', now());
$$;
REVOKE ALL ON FUNCTION public.admin_db_ping() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_db_ping() TO service_role;
