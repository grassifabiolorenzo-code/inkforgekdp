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

(Definite in `20260901050000_retention_cleanup.sql` e `20260901040000_rate_limiting.sql`.)

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
   ```

4. Verifica che siano attivi: `select * from cron.job;` deve mostrare le 3 righe con `active = true`.
5. Per disattivare/rimuovere una schedulazione in futuro: `select cron.unschedule('cleanup-audit-logs-daily');` (idem per le altre).

Finché questo passaggio non viene fatto, le funzioni esistono e funzionano se richiamate a mano,
ma nessuno le richiama automaticamente: `audit_logs`, `admin_notifications` e `rate_limit_hits`
continuano a crescere senza limite.
