/**
 * TOOL 8 — Social & Ads Promo Kit.
 *
 * Generazione primaria: AI (Lovable AI Gateway), multilingua secondo il
 * selettore di lingua di output della piattaforma. Motore a template locale
 * mantenuto come fallback automatico se l'AI non è disponibile: copre le
 * stesse 7 lingue di output della piattaforma (vedi promoLocales.ts), non
 * solo l'italiano.
 */

import { type AiToneId } from "@/components/tools/ai/aiStyle";
import { PROMO_LOCALE_PACKS, type PromoLocale } from "./promoLocales";

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

export const PLATFORMS: {
  id: PromoPlatform;
  label: string;
  hashtagStyle: "many" | "few" | "none";
}[] = [
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

function fill(template: string, input: PromoInput, pack: (typeof PROMO_LOCALE_PACKS)["it"]) {
  const uspShort = input.usp.length > 60 ? `${input.usp.slice(0, 57)}...` : input.usp;
  return template
    .replaceAll("{title}", input.bookTitle || pack.defaults.title)
    .replaceAll("{usp}", input.usp || pack.defaults.usp)
    .replaceAll("{usp_short}", uspShort || pack.defaults.uspShort)
    .replaceAll("{audience}", input.audience || pack.defaults.audience)
    .replaceAll("{audience_lower}", (input.audience || pack.defaults.audience).toLowerCase())
    .replaceAll("{cta}", input.cta || pack.defaults.cta);
}

/**
 * Fallback a template, usato automaticamente se l'AI non è disponibile. Copre
 * le stesse 7 lingue di output della piattaforma (vedi promoLocales.ts) — non
 * ripiega più sempre sull'italiano indipendentemente dalla lingua richiesta.
 */
export function generatePromoKitLocal(input: PromoInput, locale: string = "it"): PromoOutput {
  const pack =
    PROMO_LOCALE_PACKS[
      (locale as PromoLocale) in PROMO_LOCALE_PACKS ? (locale as PromoLocale) : "it"
    ];
  const platforms =
    input.platforms.length > 0 ? input.platforms : (["instagram", "facebook"] as PromoPlatform[]);

  const posts: SocialPost[] = platforms.map((platform) => {
    const meta = PLATFORMS.find((p) => p.id === platform)!;
    let caption = fill(pick(pack.postTemplates[platform]), input, pack);
    if (meta.hashtagStyle !== "none") {
      const tags = [
        slugHashtag(input.genre || pack.defaults.genreFallback),
        meta.hashtagStyle === "many" ? pack.hashtagMany : "",
      ]
        .filter(Boolean)
        .join(" ");
      if (tags.trim()) caption = `${caption}\n\n${tags}`;
    }
    return { platform, caption };
  });

  const adsHeadlines = pack.adHeadlineTemplates.map((t) => fill(t, input, pack));
  const adsBullets = pack.adBulletTemplates.map((t) => fill(t, input, pack));

  const email = pack.email;
  const emailTitle = input.bookTitle || pack.defaults.title;
  const launchEmail = [
    `${email.subjectPrefix} "${emailTitle}" ${email.subjectAvailable}`,
    "",
    email.greeting,
    "",
    email.announce(emailTitle),
    "",
    input.usp ? `${input.usp}` : "",
    "",
    input.audience ? email.audienceLine(input.audience.toLowerCase()) : "",
    input.cta || email.defaultCta,
    "",
    email.closing,
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
