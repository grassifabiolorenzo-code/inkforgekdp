/**
 * Dati strutturati (JSON-LD) per le pagine pubbliche. Costruiti dalle stesse
 * fonti di verità già usate dalla UI (PLANS, FAQ_ITEMS): nessun testo
 * duplicato da tenere sincronizzato a mano.
 */
import { PLANS } from "@/config/plans";
import { SITE_URL } from "@/config/site";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "InkForgeKdp",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "InkForgeKdp",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${SITE_URL}/pricing`,
    description:
      "Suite di 8 tool per pubblicare libri su Amazon KDP: copertine, listing, contenuti A+, triage immagini, impaginazione interni, blurb, bio autore e kit promozionali.",
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.price),
      priceCurrency: plan.currency,
      url: `${SITE_URL}/pricing`,
    })),
  };
}

export function faqSchema(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
