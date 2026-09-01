-- Funzioni di pulizia per data governance/GDPR. Non schedulano nulla da sole
-- (CREATE EXTENSION pg_cron può richiedere l'abilitazione manuale dal
-- dashboard Supabase a seconda del piano): vanno collegate a pg_cron a parte,
-- vedi le istruzioni fornite insieme a questa migration.

-- Audit log: retention 1 anno. Sono comunque eventi di sicurezza, non dati
-- utente diretti, quindi una retention lunga è appropriata (non un obbligo
-- GDPR stringente come per i dati personali diretti).
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.audit_logs WHERE created_at < now() - interval '1 year';
$$;
REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs() TO service_role;

-- Notifiche admin: retention 90 giorni, sono solo un campanello operativo.
CREATE OR REPLACE FUNCTION public.cleanup_old_admin_notifications()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_notifications WHERE created_at < now() - interval '90 days';
$$;
REVOKE ALL ON FUNCTION public.cleanup_old_admin_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_admin_notifications() TO service_role;
