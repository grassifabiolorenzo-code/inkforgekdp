-- ============================================================================
-- Query aggregate per il back office Marketing/Email (lead, campagne, log invii).
-- Stessa forma di admin_list_referrals/admin_referral_kpis.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_leads(
  _search TEXT DEFAULT NULL,
  _status TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, email TEXT, name TEXT, source TEXT, locale TEXT, status TEXT,
  marketing_consent BOOLEAN, consented_at TIMESTAMPTZ, converted_user_id UUID,
  created_at TIMESTAMPTZ, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id, l.email, l.name, l.source, l.locale, l.status,
    l.marketing_consent, l.consented_at, l.converted_user_id,
    l.created_at,
    count(*) OVER()::bigint AS total_count
  FROM public.leads l
  WHERE (_search IS NULL OR _search = '' OR l.email ILIKE '%' || _search || '%' OR l.name ILIKE '%' || _search || '%')
    AND (_status IS NULL OR _status = '' OR l.status = _status)
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 200) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.admin_list_leads(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_leads(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_list_email_campaigns(
  _status TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, name TEXT, subject TEXT, audience TEXT, status TEXT,
  scheduled_at TIMESTAMPTZ, sent_at TIMESTAMPTZ,
  recipients_total INTEGER, recipients_sent INTEGER, recipients_failed INTEGER,
  created_at TIMESTAMPTZ, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id, c.name, c.subject, c.audience, c.status,
    c.scheduled_at, c.sent_at,
    c.recipients_total, c.recipients_sent, c.recipients_failed,
    c.created_at,
    count(*) OVER()::bigint AS total_count
  FROM public.email_campaigns c
  WHERE (_status IS NULL OR _status = '' OR c.status = _status)
  ORDER BY c.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 200) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.admin_list_email_campaigns(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_email_campaigns(TEXT, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_list_email_sends(
  _recipient_user_id UUID DEFAULT NULL,
  _recipient_email TEXT DEFAULT NULL,
  _campaign_id UUID DEFAULT NULL,
  _limit INTEGER DEFAULT 25,
  _offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID, recipient_email TEXT, recipient_user_id UUID, recipient_lead_id UUID,
  kind TEXT, event TEXT, campaign_id UUID, template_id UUID, subject TEXT,
  status TEXT, error TEXT, sent_by UUID, sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ, total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.recipient_email, s.recipient_user_id, s.recipient_lead_id,
    s.kind, s.event, s.campaign_id, s.template_id, s.subject,
    s.status, s.error, s.sent_by, s.sent_at,
    s.created_at,
    count(*) OVER()::bigint AS total_count
  FROM public.email_sends s
  WHERE (_recipient_user_id IS NULL OR s.recipient_user_id = _recipient_user_id)
    AND (_recipient_email IS NULL OR _recipient_email = '' OR s.recipient_email = lower(_recipient_email))
    AND (_campaign_id IS NULL OR s.campaign_id = _campaign_id)
  ORDER BY s.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 25), 1), 200) OFFSET GREATEST(COALESCE(_offset, 0), 0);
$$;
REVOKE ALL ON FUNCTION public.admin_list_email_sends(UUID, TEXT, UUID, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_email_sends(UUID, TEXT, UUID, INTEGER, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_email_kpis()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_leads', (SELECT count(*) FROM public.leads),
    'subscribed_leads', (SELECT count(*) FROM public.leads WHERE status = 'subscribed'),
    'unsubscribed_leads', (SELECT count(*) FROM public.leads WHERE status = 'unsubscribed'),
    'converted_leads', (SELECT count(*) FROM public.leads WHERE converted_user_id IS NOT NULL),
    'campaigns_sent', (SELECT count(*) FROM public.email_campaigns WHERE status = 'sent'),
    'emails_sent_last_30d', (
      SELECT count(*) FROM public.email_sends
      WHERE status = 'sent' AND created_at > now() - interval '30 days'
    ),
    'emails_queued_no_provider', (
      SELECT count(*) FROM public.email_sends WHERE status = 'skipped_no_provider'
    )
  );
$$;
REVOKE ALL ON FUNCTION public.admin_email_kpis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_email_kpis() TO service_role;
