import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";

const title = "Privacy Policy — OP+studioKdp";
const description =
  "Come OP+studioKdp raccoglie, utilizza e protegge i dati personali degli utenti della piattaforma.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Dati raccolti</h2>
            <p>
              Raccogliamo i dati necessari a fornire il servizio: email, nome, avatar, dati di
              abbonamento e registro degli utilizzi dei tool. I dati di pagamento sono trattati
              esclusivamente da Lemon Squeezy: non conserviamo i dati della tua carta.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Finalità del trattamento</h2>
            <p>
              I dati sono utilizzati per autenticarti, gestire l'abbonamento, applicare i limiti di
              utilizzo, fornire assistenza e migliorare la piattaforma.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. File caricati nei tool</h2>
            <p>
              I file elaborati dai tool sono usati soltanto per produrre il risultato richiesto e non
              vengono ceduti a terzi.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Conservazione</h2>
            <p>
              I dati dell'account sono conservati fino all'eliminazione dell'account. Puoi eliminare
              l'account in qualsiasi momento dalla pagina Profilo.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. I tuoi diritti</h2>
            <p>
              Puoi richiedere accesso, rettifica, portabilità o cancellazione dei tuoi dati
              scrivendo al supporto.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
