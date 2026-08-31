import { createFileRoute, Link } from "@tanstack/react-router";

import { FaqSection } from "@/components/landing/FaqSection";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { ToolsSection } from "@/components/landing/ToolsSection";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { PricingSection } from "@/components/pricing/PricingSection";
import { Button } from "@/components/ui/button";

const title = "InkForgeKdp — Suite di tool per pubblicare su Amazon KDP";
const description =
  "Copertine, listing, contenuti A+ e triage immagini in un'unica piattaforma. Tutti i tool in ogni piano, da €15/mese.";

export const Route = createFileRoute("/")({
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
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <ToolsSection />
        <PricingSection />
        <ComparisonTable />
        <FaqSection />

        <section className="mx-auto max-w-4xl px-4 pb-24">
          <div className="panel-highlight glow-green p-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Pronto a pubblicare con <span className="text-gradient">InkForgeKdp</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Attiva il tuo piano in un minuto e inizia subito a usare i quattro tool.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-gradient-brand mt-6 text-primary-foreground hover:opacity-90"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Inizia ora
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
