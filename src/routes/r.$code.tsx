import { createFileRoute, redirect } from "@tanstack/react-router";

import { storeReferralCode } from "@/lib/referralCapture";

/**
 * Link referral personale: inkforgekdp.<dominio>/r/CODICE. Cattura il codice
 * PRIMA della registrazione (localStorage) e reindirizza al signup — la
 * registrazione effettiva avviene poi normalmente su /auth, e il codice
 * viene consumato una sola volta al momento della creazione del profilo
 * (vedi getAccountState in credits.functions.ts). Nessun nuovo sistema di
 * routing: riusa /auth con lo stesso schema di search params già esistente
 * (mode/plan), aggiungendo solo "ref".
 */
export const Route = createFileRoute("/r/$code")({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (typeof window !== "undefined") {
      storeReferralCode(params.code);
    }
    throw redirect({ to: "/auth", search: { mode: "signup" } });
  },
});
