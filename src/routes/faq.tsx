import { createFileRoute } from "@tanstack/react-router";

import { FaqSection } from "@/components/landing/FaqSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { ToolsSection } from "@/components/landing/ToolsSection";

const title = "FAQ — InkForgeKdp";
const description =
  "Come funzionano i crediti, il bonus Starter del primo mese, i limiti dei piani e la gestione dell'abbonamento su InkForgeKdp.";

export const Route = createFileRoute("/faq")({
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
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <main>
        <div className="pt-16 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Domande <span className="text-gradient">frequenti</span>
          </h1>
        </div>
        <FaqSection />
        <ToolsSection />
      </main>
      <SiteFooter />
    </div>
  );
}
