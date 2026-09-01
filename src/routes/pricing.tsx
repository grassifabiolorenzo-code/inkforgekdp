import { createFileRoute } from "@tanstack/react-router";

import { FaqSection } from "@/components/landing/FaqSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { ComparisonTable } from "@/components/pricing/ComparisonTable";
import { PricingSection } from "@/components/pricing/PricingSection";
import { canonicalUrl } from "@/config/site";
import { softwareApplicationSchema } from "@/lib/structuredData";

const title = "Prezzi e piani — InkForgeKdp";
const description =
  "Starter €15/mese con 50 utilizzi e +50 bonus il primo mese, Pro €35/mese con 300 utilizzi, Business €99/mese illimitato. A+ KDPstudio incluso in Pro e Business.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: canonicalUrl("/pricing") },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/brand/logo.png" },
      { name: "twitter:image", content: "/brand/logo.png" },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/pricing") }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(softwareApplicationSchema()) },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <div className="relative overflow-hidden pt-16 text-center">
          <div className="hero-aura aura-violet -top-24 left-1/3 size-96" aria-hidden />
          <h1 className="relative text-4xl font-black tracking-tight sm:text-5xl">
            Un piano per <span className="text-gradient">ogni ritmo di pubblicazione</span>
          </h1>
          <p className="relative mx-auto mt-4 max-w-xl px-4 text-muted-foreground">
            Otto strumenti in totale: quali sono inclusi e quanti utilizzi mensili hai dipende dal
            piano scelto.
          </p>
        </div>
        <PricingSection />
        <ComparisonTable />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
