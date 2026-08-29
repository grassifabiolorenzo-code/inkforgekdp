import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Testi placeholder facilmente modificabili.
 */
export const HERO_COPY = {
  eyebrow: "Suite professionale per editori KDP",
  headline: "Pubblica su KDP più velocemente, con qualità da studio editoriale",
  subheadline:
    "OP+studioKdp riunisce copertine, listing, contenuti A+ e triage immagini in un'unica piattaforma. Un solo abbonamento, quattro strumenti, zero software da installare.",
  primaryCta: "Inizia ora",
  secondaryCta: "Scopri i piani",
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-aura aura-violet -top-32 left-[10%] size-[28rem]" aria-hidden />
      <div className="hero-aura aura-green -top-10 right-[5%] size-[22rem] opacity-25" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <Badge variant="outline" className="border-border bg-gradient-brand-soft text-foreground">
          {HERO_COPY.eyebrow}
        </Badge>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          {HERO_COPY.headline.split(", ")[0]},{" "}
          <span className="text-gradient">{HERO_COPY.headline.split(", ")[1]}</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {HERO_COPY.subheadline}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            asChild
            className="bg-gradient-brand w-full text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              {HERO_COPY.primaryCta}
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/pricing">{HERO_COPY.secondaryCta}</Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-accent" /> Tutti e 4 i tool in ogni piano
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-accent" /> Cancelli quando vuoi
          </span>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="panel glow-violet overflow-hidden p-2">
            <img
              src={dashboardPreview}
              alt="Anteprima della dashboard OP+studioKdp con crediti e i quattro tool"
              width={1600}
              height={1008}
              className="w-full rounded-lg"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-8 -bottom-6 h-24 bg-gradient-brand opacity-20 blur-3xl"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
