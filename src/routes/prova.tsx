import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Clock, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/landing/FaqSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { APlusPreviewDemo } from "@/components/landing/demo/APlusPreviewDemo";
import { InteriorPreviewDemo } from "@/components/landing/demo/InteriorPreviewDemo";
import { ListingPreviewDemo } from "@/components/landing/demo/ListingPreviewDemo";

const title = "Prova gratis InkForgeKdp — anteprima senza registrazione";
const description =
  "Vedi subito quanto tempo risparmi con InkForgeKdp: prova tre tool gratis, senza registrazione. Anteprima con filigrana, testo completo e download sbloccati con un abbonamento.";

export const Route = createFileRoute("/prova")({
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
  component: ProvaPage,
});

const TIME_SAVINGS: { tool: string; before: string; after: string }[] = [
  { tool: "Copertine", before: "1-2 ore su Canva/Photoshop, calcolando dorso e bleed a mano", after: "5 minuti, guide KDP calcolate in automatico" },
  { tool: "Pubblicazione", before: "30-45 minuti tra ricerca keyword e scrittura", after: "Meno di 1 minuto, analizzando davvero le tue pagine" },
  { tool: "A+ KDPstudio", before: "Un designer esterno o mezza giornata di lavoro", after: "5 moduli pronti in un'unica generazione" },
  { tool: "Triage", before: "Ore a controllare le immagini una per una", after: "Smistamento a frecce da tastiera, un'immagine al secondo" },
  { tool: "Interni", before: "Giorni di impaginazione manuale su InDesign", after: "PDF interno pronto in pochi minuti" },
  { tool: "Blurb & Sinossi", before: "Un pomeriggio davanti al foglio bianco", after: "Quarta di copertina pronta in pochi secondi" },
  { tool: "Bio Autore & Kit Stampa", before: "Riscrivere la bio da zero ogni volta", after: "Bio breve, media, lunga e comunicato insieme" },
  { tool: "Social & Ads Promo Kit", before: "Post, headline Ads ed email scritti uno a uno", after: "Materiale di lancio completo in un colpo solo" },
];

function ProvaPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <div className="relative overflow-hidden pt-16 text-center">
          <div className="hero-aura aura-violet -top-24 left-1/3 size-96" aria-hidden />
          <Badge variant="outline" className="border-border bg-gradient-brand-soft text-foreground">
            Prova gratis, senza registrazione
          </Badge>
          <h1 className="relative mx-auto mt-4 max-w-3xl px-4 text-4xl font-black tracking-tight sm:text-5xl">
            Quanto tempo perdi ancora a impaginare <span className="text-gradient">a mano</span>?
          </h1>
          <p className="relative mx-auto mt-4 max-w-2xl px-4 text-muted-foreground">
            Prova tre dei nostri strumenti qui sotto, dal vivo, senza creare un account. L'anteprima è reale — è
            volutamente limitata: filigrana sulle immagini, testo parziale, nessun download pulito. Il risultato
            completo lo sblocchi con un abbonamento.
          </p>
        </div>

        {/* Tabella tempo risparmiato */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Il tempo che riprendi <span className="text-gradient">indietro</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Otto strumenti, ognuno pensato per sostituire un lavoro manuale che oggi ti porta via ore.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIME_SAVINGS.map((t) => (
              <div key={t.tool} className="panel space-y-3 p-5">
                <p className="text-sm font-semibold">{t.tool}</p>
                <div className="space-y-1.5 text-xs">
                  <p className="flex items-start gap-1.5 text-muted-foreground line-through decoration-muted-foreground/50">
                    <Clock className="mt-0.5 size-3.5 shrink-0" />
                    {t.before}
                  </p>
                  <p className="flex items-start gap-1.5 font-medium text-accent">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0" />
                    {t.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Demo live 1 — testi */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="panel p-6 sm:p-10">
            <ListingPreviewDemo />
          </div>
        </section>

        {/* Demo live 2 — A+ KDPstudio */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="panel p-6 sm:p-10">
            <APlusPreviewDemo />
          </div>
        </section>

        {/* Demo live 3 — interni */}
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="panel p-6 sm:p-10">
            <InteriorPreviewDemo />
          </div>
        </section>

        {/* Trasparenza sui limiti dell'anteprima */}
        <section className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row">
            <ShieldCheck className="size-6 shrink-0 text-accent" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Perché l'anteprima è limitata</p>
              <p>
                Quello che vedi sopra è generato dal vero motore dei tool, non un video o uno screenshot statico.
                Per lo stesso motivo, senza un abbonamento attivo: le immagini restano coperte da filigrana e
                inutilizzabili come asset finale, i testi lunghi vengono mostrati solo in parte, e non è possibile
                scaricare né copiare il risultato completo. Con un piano attivo tutto questo si sblocca, per tutti
                e otto i tool.
              </p>
            </div>
          </div>
        </section>

        {/* CTA finale */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pronto a smettere di farlo <span className="text-gradient">a mano</span>?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Attiva un piano in un minuto: sblocchi subito tutti i tool, senza filigrane né limiti di testo.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground hover:opacity-90">
              <Link to="/pricing">Vedi i piani</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Lock className="mr-2 size-4" /> Crea un account
              </Link>
            </Button>
          </div>
        </section>

        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
