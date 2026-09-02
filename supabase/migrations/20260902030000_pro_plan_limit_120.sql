-- ============================================================================
-- Riduce il limite mensile del piano Pro da 300 a 120 utilizzi (audit
-- modernizzazione, 2026-09-02) — prezzo invariato (€35/mese). Ogni operazione
-- costa un credito fisso indipendente da pagine/moduli generati (vedi
-- consume_credit): un publisher Pro a volume sostenuto consuma in media circa
-- 65-70 crediti/mese, quindi 300 regalava una capacità quasi mai usata dalla
-- maggioranza degli abbonati. 120 lascia comunque un margine di quasi 2× sopra
-- questa media, lo stesso rapporto già presente nel piano Starter (50 crediti
-- su una media stimata di circa 28/mese) — non tocca Starter né Business, già
-- ben calibrati secondo lo stesso modello.
-- ============================================================================

UPDATE public.plans SET monthly_limit = 120 WHERE slug = 'pro';
