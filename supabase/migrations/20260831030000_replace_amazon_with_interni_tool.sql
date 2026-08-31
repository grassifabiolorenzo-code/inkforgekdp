-- Sostituisce il tool "amazon" (Amazon Marketplace, rimosso) con "interni"
-- (impaginatore per gli interni del libro) nei piani esistenti.

ALTER TABLE public.plans
  ALTER COLUMN allowed_tools
  SET DEFAULT ARRAY['copertine','pubblicazione','aplus','triage','interni','blurb','bio','promo']::TEXT[];

UPDATE public.plans
  SET allowed_tools = array_replace(allowed_tools, 'amazon', 'interni')
  WHERE 'amazon' = ANY(allowed_tools);
