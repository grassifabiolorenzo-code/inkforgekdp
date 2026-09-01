import { createFileRoute } from "@tanstack/react-router";

import { FAQ_ITEMS, FaqSection } from "@/components/landing/FaqSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { ToolsSection } from "@/components/landing/ToolsSection";
import { canonicalUrl } from "@/config/site";
import { faqSchema } from "@/lib/structuredData";

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
      { property: "og:url", content: canonicalUrl("/faq") },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/brand/logo.png" },
      { name: "twitter:image", content: "/brand/logo.png" },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/faq") }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqSchema(FAQ_ITEMS)) }],
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
