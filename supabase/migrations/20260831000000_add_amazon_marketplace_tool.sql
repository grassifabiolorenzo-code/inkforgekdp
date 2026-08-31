-- Aggiunge il 5° tool "amazon" (Amazon Marketplace) ai piani esistenti.

ALTER TABLE public.plans
  ALTER COLUMN allowed_tools
  SET DEFAULT ARRAY['copertine','pubblicazione','aplus','triage','amazon']::TEXT[];

UPDATE public.plans
  SET allowed_tools = array_append(allowed_tools, 'amazon')
  WHERE NOT ('amazon' = ANY(allowed_tools));
