# Job pianificati (pg_cron)

Nessuna funzione di pulizia dati si pianifica da sola: vanno collegate a `pg_cron`
una tantum dal dashboard Supabase. Sono tutte `SECURITY DEFINER`, richiamabili solo
da `service_role` (già garantito da `pg_cron`, che gira come superuser).

## Funzioni da schedulare

| Funzione | Cosa fa | Frequenza consigliata |
|---|---|---|
| `cleanup_old_audit_logs()` | Elimina `audit_logs` più vecchi di 1 anno | Giornaliera, notte |
| `cleanup_old_admin_notifications()` | Elimina `admin_notifications` più vecchie di 90 giorni | Giornaliera, notte |
| `cleanup_rate_limit_hits()` | Elimina le righe di `rate_limit_hits` scadute | Ogni ora |
| `cleanup_expired_book_projects()` | Elimina i `book_projects` scaduti (48h da ultimo utilizzo) e i relativi file su Storage | Ogni ora |

(Definite in `20260901050000_retention_cleanup.sql`, `20260901040000_rate_limiting.sql` e
`20260902000000_book_projects.sql`; TTL alzato da 6 a 48 ore in `20260902020000_book_projects_ttl_48h.sql`.)

`generations` (cronologia generazioni di Pubblicazione/Blurb/Bio/Promo, vedi
`20260902010000_generations_history.sql`) **non ha bisogno di un job pg_cron**: un trigger
`AFTER INSERT` tiene la cronologia di ogni utente/tool entro le 30 voci più recenti da sola, ad
ogni inserimento — nessuna riga orfana da ripulire in un secondo momento.

## Come attivarle

1. Apri il progetto su [supabase.com/dashboard](https://supabase.com/dashboard) → **Database → Extensions**.
2. Cerca `pg_cron` e abilitalo (su alcuni piani richiede conferma esplicita, non è mai automatico).
3. Vai su **SQL Editor** ed esegui, una volta sola:

   ```sql
   select cron.schedule(
     'cleanup-audit-logs-daily',
     '0 3 * * *',              -- ogni giorno alle 03:00 UTC
     $$ select public.cleanup_old_audit_logs(); $$
   );

   select cron.schedule(
     'cleanup-admin-notifications-daily',
     '15 3 * * *',
     $$ select public.cleanup_old_admin_notifications(); $$
   );

   select cron.schedule(
     'cleanup-rate-limit-hits-hourly',
     '0 * * * *',
     $$ select public.cleanup_rate_limit_hits(); $$
   );

   select cron.schedule(
     'cleanup-book-projects-hourly',
     '30 * * * *',
     $$ select public.cleanup_expired_book_projects(); $$
   );
   ```

4. Verifica che siano attivi: `select * from cron.job;` deve mostrare le 4 righe con `active = true`.
5. Per disattivare/rimuovere una schedulazione in futuro: `select cron.unschedule('cleanup-audit-logs-daily');` (idem per le altre).

Finché questo passaggio non viene fatto, le funzioni esistono e funzionano se richiamate a mano,
ma nessuno le richiama automaticamente: `audit_logs`, `admin_notifications`, `rate_limit_hits` e
`book_projects` continuano a crescere senza limite (per `book_projects` questo significa anche
file orfani su Storage mai ripuliti).
