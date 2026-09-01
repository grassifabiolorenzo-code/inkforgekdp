import { createServerFn } from "@tanstack/react-start";

import { memoize } from "@/lib/memoCache.server";

/**
 * Stato pubblico del sistema (/status), senza autenticazione: espone solo
 * "operational/degraded/down" per ciascun componente, mai dettagli interni
 * (messaggi di errore, latenza esatta, nome dell'ambiente) — quelli restano
 * riservati alla vista admin (/admin/system).
 */
export const getPublicStatus = createServerFn({ method: "GET" }).handler(async () => {
  return memoize("public-status", 30, async () => {
    const { computeSystemHealth } = await import("@/lib/systemHealth.server");
    const health = await computeSystemHealth();

    return {
      checkedAt: health.checkedAt,
      components: [
        { name: "Applicazione e database", status: health.database.status },
        { name: "Autenticazione", status: health.authentication.status },
        { name: "Pagamenti", status: health.paymentProvider.status },
        { name: "Generazione contenuti AI", status: health.aiText.status },
      ],
    };
  });
});
