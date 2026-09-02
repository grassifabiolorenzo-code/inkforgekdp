-- ============================================================================
-- Alza il TTL di default dei progetti libro da 6 a 48 ore (audit modernizzazione,
-- 2026-09-02). La vera fonte di verità resta upsertBookProject (PROJECT_TTL_MS in
-- src/lib/bookProjects.functions.ts), che imposta expires_at esplicitamente ad
-- ogni upsert — questo DEFAULT conta solo per un eventuale insert diretto che lo
-- ometta, ma va comunque allineato per coerenza.
-- ============================================================================

ALTER TABLE public.book_projects
  ALTER COLUMN expires_at SET DEFAULT now() + interval '48 hours';
