/**
 * TOOL 8 — Social & Ads Promo Kit.
 *
 * Generazione primaria: AI (Lovable AI Gateway), multilingua secondo il
 * selettore di lingua di output della piattaforma. Motore a template locale
 * mantenuto come fallback automatico se l'AI non è disponibile (resta in
 * italiano; la generazione AI copre tutte le lingue supportate).
 */

import { type AiToneId } from "@/components/tools/ai/aiStyle";

export type PromoPlatform = "instagram" | "facebook" | "tiktok" | "twitter";

export interface PromoInput {
  bookTitle: string;
  genre: string;
  usp: string;
  audience: string;
  cta: string;
  platforms: PromoPlatform[];
  tone: AiToneId;
}

export interface SocialPost {
  platform: PromoPlatform;
  caption: string;
}

export interface PromoOutput {
  posts: SocialPost[];
  adsHeadlines: string[];
  adsBullets: string[];
  launchEmail: string;
}

export const PLATFORMS: { id: PromoPlatform; label: string; hashtagStyle: "many" | "few" | "none" }[] = [
  { id: "instagram", label: "Instagram", hashtagStyle: "many" },
  { id: "facebook", label: "Facebook", hashtagStyle: "few" },
  { id: "tiktok", label: "TikTok / Reels", hashtagStyle: "many" },
  { id: "twitter", label: "X / Twitter", hashtagStyle: "few" },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function slugHashtag(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => `#${w.replace(/[^a-zA-Z0-9]/g, "")}`)
    .join(" ");
}

const POST_TEMPLATES: Record<PromoPlatform, string[]> = {
  instagram: [
    "📖 \"{title}\" è finalmente disponibile.\n\n{usp}\n\nPensato per {audience}. {cta} 👇",
    "Ci ho messo il cuore in \"{title}\" — {usp}\n\nSe ti riconosci in {audience}, questo libro fa per te.\n{cta}",
  ],
  facebook: [
    "Novità in libreria (digitale e cartacea): \"{title}\".\n\n{usp}\n\nConsigliato a {audience}. {cta}",
    "\"{title}\" è online. {usp} Se ti interessa {audience_lower}, dagli un'occhiata: {cta}",
  ],
  tiktok: [
    "POV: hai appena scoperto \"{title}\" 📚✨ {usp} #booktok",
    "Se sei {audience_lower}, devi assolutamente leggere \"{title}\". {usp} {cta}",
  ],
  twitter: [
    "\"{title}\" è uscito. {usp} {cta}",
    "Nuovo libro: \"{title}\". Pensato per {audience_lower}. {cta}",
  ],
};

const AD_HEADLINE_TEMPLATES = [
  "{title}: {usp_short}",
  "Scopri {title} — {usp_short}",
  "{usp_short}. Leggi {title} oggi stesso",
];

const AD_BULLET_TEMPLATES = [
  "Perfetto per {audience_lower}",
  "{usp_short}",
  "Disponibile in formato cartaceo ed eBook",
  "Il libro di cui {audience_lower} sta parlando",
];

function fill(template: string, input: PromoInput) {
  const uspShort = input.usp.length > 60 ? `${input.usp.slice(0, 57)}...` : input.usp;
  return template
    .replaceAll("{title}", input.bookTitle || "il libro")
    .replaceAll("{usp}", input.usp || "una storia che non dimenticherai")
    .replaceAll("{usp_short}", uspShort || "una lettura da non perdere")
    .replaceAll("{audience}", input.audience || "chi ama leggere")
    .replaceAll("{audience_lower}", (input.audience || "chi ama leggere").toLowerCase())
    .replaceAll("{cta}", input.cta || "Disponibile ora su Amazon.");
}

/** Fallback locale (solo italiano), usato automaticamente se l'AI non è disponibile. */
export function generatePromoKitLocal(input: PromoInput): PromoOutput {
  const platforms = input.platforms.length > 0 ? input.platforms : (["instagram", "facebook"] as PromoPlatform[]);

  const posts: SocialPost[] = platforms.map((platform) => {
    const meta = PLATFORMS.find((p) => p.id === platform)!;
    let caption = fill(pick(POST_TEMPLATES[platform]), input);
    if (meta.hashtagStyle !== "none") {
      const tags = [slugHashtag(input.genre || "libri"), meta.hashtagStyle === "many" ? "#bookstagram #leggere" : ""]
        .filter(Boolean)
        .join(" ");
      if (tags.trim()) caption = `${caption}\n\n${tags}`;
    }
    return { platform, caption };
  });

  const adsHeadlines = AD_HEADLINE_TEMPLATES.map((t) => fill(t, input));
  const adsBullets = AD_BULLET_TEMPLATES.map((t) => fill(t, input));

  const launchEmail = [
    `Oggetto: "${input.bookTitle || "Il mio nuovo libro"}" è disponibile da oggi`,
    "",
    `Ciao,`,
    "",
    `sono felice di annunciare che "${input.bookTitle || "il mio nuovo libro"}" è finalmente disponibile.`,
    "",
    input.usp ? `${input.usp}` : "",
    "",
    input.audience ? `Se sei ${input.audience.toLowerCase()}, penso che questo libro possa fare al caso tuo.` : "",
    "",
    input.cta || "Puoi trovarlo su Amazon, in formato cartaceo ed eBook.",
    "",
    "Grazie per il supporto, come sempre.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { posts, adsHeadlines, adsBullets, launchEmail };
}

export function formatPromoKitForExport(input: PromoInput, output: PromoOutput): string {
  const lines: string[] = [`=== SOCIAL & ADS PROMO KIT — ${input.bookTitle || "Libro"} ===`, ""];

  lines.push("--- Post social ---");
  output.posts.forEach((post) => {
    const label = PLATFORMS.find((p) => p.id === post.platform)?.label ?? post.platform;
    lines.push(`[${label}]`, post.caption, "");
  });

  lines.push("--- Amazon Ads — Headline ---");
  output.adsHeadlines.forEach((h, i) => lines.push(`${i + 1}. ${h}`));
  lines.push("");

  lines.push("--- Amazon Ads — Bullet ---");
  output.adsBullets.forEach((b, i) => lines.push(`${i + 1}. ${b}`));
  lines.push("");

  lines.push("--- Email di lancio ---");
  lines.push(output.launchEmail);

  return lines.join("\n");
}
