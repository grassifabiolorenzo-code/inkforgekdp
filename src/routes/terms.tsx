import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { canonicalUrl } from "@/config/site";
import { getPlan } from "@/config/plans";

const title = "Termini e condizioni — InkForgeKdp";
const description =
  "Condizioni d'uso di InkForgeKdp: abbonamenti mensili, crediti di utilizzo, rinnovi e cancellazioni.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonicalUrl("/terms") },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/brand/logo.png" },
      { name: "twitter:image", content: "/brand/logo.png" },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/terms") }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Termini e condizioni</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Servizio</h2>
            <p>
              InkForgeKdp è una piattaforma in abbonamento che fornisce otto strumenti per la
              pubblicazione su Amazon KDP. L'accesso ai singoli tool dipende dal piano attivo.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Abbonamenti e pagamenti</h2>
            <p>
              Gli abbonamenti sono mensili e si rinnovano automaticamente. Pagamenti, rinnovi,
              upgrade e cancellazioni sono gestiti tramite Lemon Squeezy, che agisce come venditore
              per le transazioni.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Crediti di utilizzo</h2>
            <p>
              Ogni piano include un numero di utilizzi per periodo (Starter{" "}
              {getPlan("starter")?.monthlyLimit}, Pro {getPlan("pro")?.monthlyLimit}, Business
              illimitato). Un credito viene consumato soltanto al completamento dell'operazione
              finale del tool. Le operazioni fallite non vengono addebitate. I crediti non
              utilizzati non vengono trasferiti al periodo successivo.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Bonus primo mese</h2>
            <p>
              Il bonus di 50 utilizzi aggiuntivi è riservato al primo abbonamento Starter ed è
              concesso una sola volta per account, anche in caso di cancellazione e successiva
              riattivazione.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Uso corretto</h2>
            <p>
              È vietato tentare di aggirare i limiti di utilizzo, condividere l'account o utilizzare
              la piattaforma per contenuti illeciti.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Cancellazione</h2>
            <p>
              Puoi cancellare l'abbonamento in qualsiasi momento: manterrai l'accesso fino al
              termine del periodo già pagato.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
