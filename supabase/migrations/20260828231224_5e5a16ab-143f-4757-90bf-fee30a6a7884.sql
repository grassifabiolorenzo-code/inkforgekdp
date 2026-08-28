REVOKE ALL ON FUNCTION public.get_credit_state() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_credit(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_credit_state() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_credit(TEXT, TEXT, TEXT) TO authenticated, service_role;