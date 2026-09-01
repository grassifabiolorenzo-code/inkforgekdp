-- ============================================================================
-- CORRISPONDENZA EMAIL & MARKETING — schema di base
-- ============================================================================
-- Nessun provider email è ancora collegato (vedi src/lib/email/provider.server.ts):
-- questo schema traccia comunque OGNI invio (riuscito, in coda o soppresso) fin
-- da subito, esattamente come pro_referral_pricing/payments restano corretti
-- prima della registrazione a Lemon Squeezy. Nessun invio reale finché non
-- viene collegata una API key, ma zero funzionalità finta nel frattempo.

-- Contatti raccolti dalla landing page (newsletter), NON necessariamente mai
-- diventati utenti registrati — tabella separata da profiles perché non hanno
-- un account auth.users.
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL DEFAULT 'landing_newsletter',
  locale TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  consented_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed', 'bounced')),
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  -- Valorizzato quando l'email del lead coincide con un nuovo signup: permette
  -- di misurare il tasso di conversione lead → abbonato senza altra logica.
  converted_user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);
CREATE INDEX leads_status_idx ON public.leads (status);
CREATE INDEX leads_unsubscribe_token_idx ON public.leads (unsubscribe_token);
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated/anon: letto e scritto solo da server function
-- (service_role) — un visitatore anonimo non deve mai poter leggere l'elenco lead.
CREATE TRIGGER leads_touch BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Preferenze email di un abbonato reale: separate dalle transazionali (ricevute,
-- avvisi di pagamento), che restano sempre dovute indipendentemente da questo flag.
ALTER TABLE public.profiles ADD COLUMN marketing_opt_out BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN email_unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Contenuto delle email: sia gli eventi di ciclo vita (transactional, chiave =
-- NotificationEvent) sia i modelli riutilizzabili per le campagne promozionali.
-- Tabella, non testo hardcoded nel codice: modificabile dall'admin senza deploy,
-- stesso principio di referral_config/referral_level_rewards.
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'promotional')),
  locale TEXT NOT NULL DEFAULT 'it',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, locale)
);
GRANT SELECT ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_select_all" ON public.email_templates FOR SELECT TO authenticated USING (true);
CREATE TRIGGER email_templates_touch BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Broadcast promozionali creati dall'admin verso un segmento di contatti.
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (
    audience IN ('all_leads', 'all_subscribers', 'plan_starter', 'plan_pro', 'plan_business', 'all_contacts')
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')
  ),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  recipients_total INTEGER NOT NULL DEFAULT 0,
  recipients_sent INTEGER NOT NULL DEFAULT 0,
  recipients_failed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX email_campaigns_status_idx ON public.email_campaigns (status);
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated: gestito solo dall'admin via server function.
CREATE TRIGGER email_campaigns_touch BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Log di OGNI email (transazionale, promozionale o corrispondenza manuale 1:1):
-- è la "corrispondenza" consultabile dall'admin per ciascun abbonato/lead.
CREATE TABLE public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  recipient_lead_id UUID REFERENCES public.leads ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('transactional', 'promotional', 'manual')),
  event TEXT,
  campaign_id UUID REFERENCES public.email_campaigns ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'sent', 'failed', 'skipped_suppressed', 'skipped_no_provider')
  ),
  error TEXT,
  sent_by UUID REFERENCES auth.users ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX email_sends_recipient_email_idx ON public.email_sends (recipient_email);
CREATE INDEX email_sends_recipient_user_idx ON public.email_sends (recipient_user_id);
CREATE INDEX email_sends_campaign_idx ON public.email_sends (campaign_id);
CREATE INDEX email_sends_created_idx ON public.email_sends (created_at DESC);
GRANT ALL ON public.email_sends TO service_role;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
-- Nessuna policy per authenticated: scritto e letto solo da server function
-- (invio email + vista admin), mai direttamente dal client.

-- Seed: le 8 email di ciclo vita già previste da NotificationEvent
-- (src/services/notifications.server.ts) + il benvenuto per chi si iscrive
-- dalla newsletter della landing. Testi in locale 'it' (l'admin potrà
-- aggiungere varianti per le altre lingue supportate dalla stessa UI, senza
-- ulteriori migration).
INSERT INTO public.email_templates (key, name, category, subject, body_html) VALUES
  (
    'welcome',
    'Benvenuto nuovo abbonato',
    'transactional',
    'Benvenuto in InkForgeKdp, {{name}}!',
    '<p>Ciao {{name}},</p><p>benvenuto in InkForgeKdp! Il tuo account è pronto: hai già accesso ai tool inclusi nel tuo piano.</p><p>Se hai domande, rispondi pure a questa email: c''è sempre una persona vera dall''altra parte.</p><p>Buona pubblicazione,<br>Il team InkForgeKdp</p>'
  ),
  (
    'subscription_confirmed',
    'Abbonamento confermato',
    'transactional',
    'Il tuo abbonamento {{plan_name}} è attivo',
    '<p>Ciao {{name}},</p><p>il tuo abbonamento <strong>{{plan_name}}</strong> è confermato e attivo da subito.</p><p>Trovi tutti i dettagli e lo storico utilizzi nella tua dashboard.</p><p>A presto,<br>Il team InkForgeKdp</p>'
  ),
  (
    'payment_success',
    'Pagamento riuscito',
    'transactional',
    'Ricevuto il tuo pagamento — InkForgeKdp',
    '<p>Ciao {{name}},</p><p>abbiamo ricevuto correttamente il pagamento del tuo abbonamento. Grazie per continuare a pubblicare con noi!</p><p>Il team InkForgeKdp</p>'
  ),
  (
    'payment_failed',
    'Pagamento fallito',
    'transactional',
    'Non siamo riusciti ad addebitare il pagamento',
    '<p>Ciao {{name}},</p><p>il pagamento del tuo abbonamento non è andato a buon fine. Succede spesso per una carta scaduta o un limite momentaneo: puoi aggiornare il metodo di pagamento dalla tua dashboard in un minuto.</p><p>Se non risolvi entro qualche giorno il tuo accesso potrebbe essere sospeso, ma siamo qui per aiutarti prima che succeda: rispondi pure a questa email.</p><p>Il team InkForgeKdp</p>'
  ),
  (
    'payment_refunded',
    'Pagamento rimborsato',
    'transactional',
    'Rimborso confermato — InkForgeKdp',
    '<p>Ciao {{name}},</p><p>ti confermiamo che il rimborso richiesto è stato elaborato. Il piano verrà aggiornato di conseguenza.</p><p>Il team InkForgeKdp</p>'
  ),
  (
    'subscription_cancelled',
    'Abbonamento cancellato',
    'transactional',
    'Ci dispiace vederti andare',
    '<p>Ciao {{name}},</p><p>il tuo abbonamento è stato cancellato: manterrai l''accesso fino al termine del periodo già pagato.</p><p>Se ti va di raccontarci cosa non ha funzionato, la tua opinione ci aiuta davvero a migliorare — e se in futuro vorrai tornare, ti aspettiamo senza penali di riattivazione.</p><p>Grazie per aver fatto parte di InkForgeKdp,<br>Il team InkForgeKdp</p>'
  ),
  (
    'limit_reached',
    'Limite mensile raggiunto',
    'transactional',
    'Hai esaurito gli utilizzi di questo mese',
    '<p>Ciao {{name}},</p><p>hai raggiunto il numero di utilizzi incluso nel tuo piano per questo periodo. Puoi aggiungere crediti extra in qualsiasi momento oppure passare a un piano superiore per avere più margine ogni mese.</p><p>Il team InkForgeKdp</p>'
  ),
  (
    'renewal_upcoming',
    'Promemoria rinnovo',
    'transactional',
    'Il tuo abbonamento si rinnova a breve',
    '<p>Ciao {{name}},</p><p>ti ricordiamo che il tuo abbonamento {{plan_name}} si rinnoverà automaticamente a breve. Non serve fare nulla se va bene così — se invece vuoi modificare o cancellare il piano, puoi farlo dalla tua dashboard prima del rinnovo.</p><p>Il team InkForgeKdp</p>'
  ),
  (
    'welcome_lead',
    'Benvenuto nuovo contatto (landing)',
    'promotional',
    'Grazie per esserti iscritto a InkForgeKdp',
    '<p>Ciao{{name_optional}},</p><p>grazie per esserti iscritto agli aggiornamenti di InkForgeKdp! Ogni tanto ti scriveremo con novità sui tool, consigli utili per pubblicare su Amazon KDP e qualche offerta riservata a chi è in lista.</p><p>Se nel frattempo vuoi dare un''occhiata alla piattaforma, la trovi qui: {{app_url}}.</p><p>A presto,<br>Il team InkForgeKdp</p><p style="font-size:12px;color:#888">Non vuoi più ricevere queste email? {{unsubscribe_url}}</p>'
  );
