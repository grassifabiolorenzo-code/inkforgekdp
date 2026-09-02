import { describe, expect, it } from "vitest";

import { AI_TONES } from "@/components/tools/ai/aiStyle";
import { generateBlurbLocal, GENRES, type BlurbInput } from "@/components/tools/blurb/blurbLogic";
import { generateBioLocal, type BioInput } from "@/components/tools/bio/bioLogic";
import {
  generatePromoKitLocal,
  PLATFORMS,
  type PromoInput,
} from "@/components/tools/promo/promoLogic";

/**
 * Il motore di riserva di Blurb/Bio/Promo copre 7 lingue con contenuto scritto
 * a mano (vedi blurbLocales.ts/bioLocales.ts/promoLocales.ts) — un volume alto
 * di testo in cui è facile lasciare un placeholder non sostituito o un
 * riferimento a una chiave di tono/genere sbagliata. Questo test non verifica
 * la qualità della traduzione (impossibile da automatizzare), ma che ogni
 * combinazione lingua × tono × genere produca output senza eccezioni e senza
 * `{placeholder}` dimenticati.
 */
const LOCALES = ["it", "en", "de", "fr", "es", "nl", "pt"] as const;
const TONES = AI_TONES.map((t) => t.id);

function assertNoUnfilledPlaceholders(text: string, context: string) {
  const leftover = text.match(/\{[a-zA-Z_]+\}/g);
  expect(leftover, `Placeholder non sostituito in ${context}: ${leftover?.join(", ")}`).toBeNull();
}

describe("generateBlurbLocal across all locales", () => {
  for (const locale of LOCALES) {
    for (const genre of GENRES) {
      it(`produces filled-in output for locale=${locale} genre=${genre.id}`, () => {
        const input: BlurbInput = {
          title: "My Book",
          genre: genre.id,
          protagonist: "Alex",
          setting: "a small coastal town",
          conflict: "a secret resurfaces",
          stakes: "everything Alex built",
          tone: "amichevole",
        };
        const result = generateBlurbLocal(input, locale);
        assertNoUnfilledPlaceholders(result.hook, `blurb hook (${locale}/${genre.id})`);
        assertNoUnfilledPlaceholders(result.synopsis, `blurb synopsis (${locale}/${genre.id})`);
        assertNoUnfilledPlaceholders(
          result.editorialBlurb,
          `blurb editorial (${locale}/${genre.id})`,
        );
        expect(result.hook.length).toBeGreaterThan(0);
        expect(result.synopsis.length).toBeGreaterThan(0);
      });
    }
  }

  for (const locale of LOCALES) {
    for (const tone of TONES) {
      it(`produces filled-in output for locale=${locale} tone=${tone}`, () => {
        const input: BlurbInput = {
          title: "",
          genre: "narrativa",
          protagonist: "",
          setting: "",
          conflict: "",
          stakes: "",
          tone,
        };
        const result = generateBlurbLocal(input, locale);
        assertNoUnfilledPlaceholders(
          result.synopsis,
          `blurb synopsis defaults (${locale}/${tone})`,
        );
      });
    }
  }
});

describe("generateBioLocal across all locales", () => {
  for (const locale of LOCALES) {
    for (const tone of TONES) {
      it(`produces filled-in output for locale=${locale} tone=${tone}`, () => {
        const input: BioInput = {
          authorName: "Jamie Rossi",
          niche: "thriller writer",
          achievements: "3 bestsellers",
          personalTouch: "loves hiking",
          tone,
          bookTitle: "The Last Signal",
          releaseInfo: "March 2027",
          links: "example.com",
        };
        const result = generateBioLocal(input, locale);
        assertNoUnfilledPlaceholders(result.shortBio, `bio short (${locale}/${tone})`);
        assertNoUnfilledPlaceholders(result.mediumBio, `bio medium (${locale}/${tone})`);
        assertNoUnfilledPlaceholders(result.longBio, `bio long (${locale}/${tone})`);
        assertNoUnfilledPlaceholders(result.pressRelease, `bio press release (${locale}/${tone})`);
        expect(result.pressRelease).toContain("The Last Signal");
      });
    }
  }

  for (const locale of LOCALES) {
    it(`handles empty optional fields for locale=${locale}`, () => {
      const input: BioInput = {
        authorName: "",
        niche: "",
        achievements: "",
        personalTouch: "",
        tone: "amichevole",
        bookTitle: "",
        releaseInfo: "",
        links: "",
      };
      const result = generateBioLocal(input, locale);
      assertNoUnfilledPlaceholders(result.longBio, `bio long defaults (${locale})`);
      assertNoUnfilledPlaceholders(result.pressRelease, `bio press release defaults (${locale})`);
    });
  }
});

describe("generatePromoKitLocal across all locales", () => {
  for (const locale of LOCALES) {
    it(`produces filled-in output for locale=${locale} with all platforms`, () => {
      const input: PromoInput = {
        bookTitle: "The Last Signal",
        genre: "thriller",
        usp: "A signal from the past that changes everything.",
        audience: "thriller readers",
        cta: "",
        platforms: PLATFORMS.map((p) => p.id),
        tone: "amichevole",
      };
      const result = generatePromoKitLocal(input, locale);
      expect(result.posts).toHaveLength(PLATFORMS.length);
      for (const post of result.posts) {
        assertNoUnfilledPlaceholders(post.caption, `promo post ${post.platform} (${locale})`);
      }
      for (const headline of result.adsHeadlines) {
        assertNoUnfilledPlaceholders(headline, `promo ad headline (${locale})`);
      }
      for (const bullet of result.adsBullets) {
        assertNoUnfilledPlaceholders(bullet, `promo ad bullet (${locale})`);
      }
      assertNoUnfilledPlaceholders(result.launchEmail, `promo launch email (${locale})`);
      expect(result.launchEmail).toContain("The Last Signal");
    });
  }

  for (const locale of LOCALES) {
    it(`handles empty optional fields for locale=${locale}`, () => {
      const input: PromoInput = {
        bookTitle: "",
        genre: "",
        usp: "",
        audience: "",
        cta: "",
        platforms: ["instagram"],
        tone: "amichevole",
      };
      const result = generatePromoKitLocal(input, locale);
      assertNoUnfilledPlaceholders(result.posts[0]!.caption, `promo post defaults (${locale})`);
      assertNoUnfilledPlaceholders(result.launchEmail, `promo launch email defaults (${locale})`);
    });
  }
});
