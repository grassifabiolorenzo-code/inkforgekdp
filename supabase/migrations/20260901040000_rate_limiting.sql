-- Rate limiting generico a finestra fissa, riusabile da qualunque server function.
-- Non pensato per traffico ad altissima frequenza (in quel caso serve un layer
-- edge come Cloudflare Rate Limiting/KV): qui copre l'abuso di endpoint sensibili
-- e a bassa frequenza per natura, come la creazione di un checkout di pagamento.

CREATE TABLE public.rate_limit_hits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX rate_limit_hits_key_idx ON public.rate_limit_hits (key, window_start DESC);
GRANT ALL ON public.rate_limit_hits TO service_role;
ALTER TABLE public.rate_limit_hits ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated/anon: letto/scritto solo dal backend (service_role).

-- Ritorna true se la chiamata è consentita (e la registra), false se il limite è superato.
-- Finestra fissa allineata a window_seconds (non sliding): sufficiente per lo scopo
-- di bloccare abusi grossolani, molto più semplice ed economico di una sliding window.
CREATE OR REPLACE FUNCTION public.check_rate_limit(_key TEXT, _max_hits INTEGER, _window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bucket TIMESTAMPTZ;
  current_hits INTEGER;
BEGIN
  bucket := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.rate_limit_hits (key, window_start, hits)
  VALUES (_key, bucket, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET hits = public.rate_limit_hits.hits + 1
  RETURNING hits INTO current_hits;

  RETURN current_hits <= _max_hits;
END;
$$;
REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- Pulizia periodica: righe più vecchie di un giorno non servono più a nulla.
-- Va eseguita da uno scheduler esterno (pg_cron se disponibile, o un cron
-- applicativo): questa funzione fornisce solo la logica, non la schedulazione.
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_hits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_hits WHERE window_start < now() - interval '1 day';
$$;
REVOKE ALL ON FUNCTION public.cleanup_rate_limit_hits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_hits() TO service_role;
