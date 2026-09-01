-- ============================================================================
-- PROGETTO LIBRO CONDIVISO — permette di riusare copertina/interno tra tool
-- diversi (Pubblicazione, A+ KDPstudio, Blurb, Bio, Promo, Interni) senza
-- ricaricare lo stesso file più volte nella stessa sessione di lavoro.
-- ============================================================================
-- Solo metadati qui: i file veri vivono su Supabase Storage (bucket
-- "book-projects", primo uso di Storage in questo progetto — nessuna tabella
-- esistente è adatta a contenere PDF interni che per un libro vero possono
-- pesare decine di MB). Upload/download avvengono direttamente dal browser
-- tramite il client Supabase lato client, mai attraverso una server function
-- (evita ogni limite di payload sulle server function).

CREATE TABLE public.book_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_path TEXT,
  cover_mime TEXT,
  interior_path TEXT,
  -- Scadenza scorrevole: si rinnova a ogni utilizzo (vedi upsertBookProject),
  -- non fissa dalla creazione. Un progetto mai riaperto scompare da solo.
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '6 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX book_projects_user_idx ON public.book_projects (user_id);
CREATE INDEX book_projects_expires_idx ON public.book_projects (expires_at);

-- Proprietario diretto via RLS: a differenza di ruoli/crediti/abbonamenti, qui
-- non c'è alcun campo sensibile su cui un mass-assignment lato client possa
-- fare danno (nome e path dei propri file) — stesso principio già usato per
-- profiles.marketing_opt_out via updateMyEmailPreferences.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_projects TO authenticated;
GRANT ALL ON public.book_projects TO service_role;
ALTER TABLE public.book_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "book_projects_owner_all" ON public.book_projects FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER book_projects_touch BEFORE UPDATE ON public.book_projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bucket privato: mai pubblico, accesso solo autenticato e solo al proprio
-- prefisso utente (stesso principio delle policy "owner" di ogni altra
-- tabella di questo progetto, qui applicato a storage.objects).
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-projects', 'book-projects', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "book_projects_storage_owner_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'book-projects' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'book-projects' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Pulizia scadenze: stesso pattern non auto-schedulante di cleanup_old_audit_logs
-- (20260901050000_retention_cleanup.sql) — va collegata a pg_cron a parte, vedi
-- supabase/migrations/README.md (4° job).
CREATE OR REPLACE FUNCTION public.cleanup_expired_book_projects()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT cover_path, interior_path FROM public.book_projects WHERE expires_at < now()
  LOOP
    DELETE FROM storage.objects
    WHERE bucket_id = 'book-projects' AND name = ANY(ARRAY[r.cover_path, r.interior_path]);
  END LOOP;

  DELETE FROM public.book_projects WHERE expires_at < now();
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_expired_book_projects() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_book_projects() TO service_role;
