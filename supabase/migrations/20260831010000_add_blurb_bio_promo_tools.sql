-- Aggiunge 3 nuovi tool alla piattaforma: "blurb" (Blurb & Sinossi), "bio"
-- (Bio Autore & Kit Stampa), "promo" (Social & Ads Promo Kit).

ALTER TABLE public.plans
  ALTER COLUMN allowed_tools
  SET DEFAULT ARRAY['copertine','pubblicazione','aplus','triage','amazon','blurb','bio','promo']::TEXT[];

UPDATE public.plans
  SET allowed_tools = allowed_tools || ARRAY(
    SELECT t FROM unnest(ARRAY['blurb','bio','promo']::TEXT[]) AS t
    WHERE NOT (t = ANY(allowed_tools))
  );
