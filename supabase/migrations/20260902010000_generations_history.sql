-- ============================================================================
-- CRONOLOGIA GENERAZIONI — salva l'output di ogni generazione di testo pagata
-- (Pubblicazione, Blurb, Bio, Promo) così un utente che chiude la scheda senza
-- copiare/scaricare non perde il testo per cui ha già pagato un credito e non
-- deve rigenerarlo pagando una seconda volta.
-- ============================================================================
-- Non copre Copertine/A+/Interni/Triage: producono file (PNG/PDF/immagini
-- canvas), non un oggetto JSON compatto — la persistenza dei loro output è un
-- problema diverso (storage di file, non di testo) già affrontato in parte
-- dal progetto libro condiviso (book_projects) per copertina/interno sorgente.

CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  title TEXT NOT NULL,
  locale TEXT NOT NULL,
  input JSONB NOT NULL,
  output JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX generations_user_tool_idx ON public.generations (user_id, tool_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generations_owner_all" ON public.generations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-limitazione: a differenza delle altre tabelle di pulizia di questo
-- progetto, qui la crescita illimitata NON dipende dall'attivazione di
-- pg_cron (spesso non ancora fatta, vedi README di questa cartella) — un
-- trigger tiene la cronologia di ogni utente/tool entro le 30 voci più
-- recenti a ogni inserimento, sempre, indipendentemente da qualunque job
-- pianificato.
CREATE OR REPLACE FUNCTION public.trim_generations_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.generations
  WHERE id IN (
    SELECT id FROM public.generations
    WHERE user_id = NEW.user_id AND tool_id = NEW.tool_id
    ORDER BY created_at DESC
    OFFSET 30
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER generations_trim_after_insert
AFTER INSERT ON public.generations
FOR EACH ROW EXECUTE FUNCTION public.trim_generations_history();
