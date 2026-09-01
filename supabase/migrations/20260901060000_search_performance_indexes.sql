-- Indici per le ricerche ILIKE usate da admin_list_users/admin_list_payments/
-- admin_global_search: senza un indice trigram, ogni ricerca è uno scan
-- completo della tabella. pg_trgm è un'estensione standard, abilitata di
-- default sulla stragrande maggioranza dei progetti Supabase.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS profiles_email_trgm_idx ON public.profiles USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_name_trgm_idx ON public.profiles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS payments_provider_payment_id_trgm_idx ON public.payments USING gin (provider_payment_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS payments_provider_order_id_trgm_idx ON public.payments USING gin (provider_order_id gin_trgm_ops);
