import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Wrapper sottile: la logica AI vive in `aiCopy.server.ts`. */

const dataUrl = z.string().max(4_000_000);

const listingInput = z.object({
  locale: z.string().min(2).max(5),
  subject: z.string().max(200).default(""),
  bookType: z.string().max(40),
  audience: z.string().max(40),
  ageDetails: z.string().max(200).default(""),
  interiorPages: z.number().int().min(0).max(2000).default(0),
  tone: z.string().max(40).optional(),
  creativity: z.number().int().min(1).max(10).optional(),
  interiorText: z.string().max(20000).optional(),
  interiorImages: z.array(dataUrl).max(3).optional(),
  coverImages: z.array(dataUrl).max(2).optional(),
});

const aplusInput = z.object({
  lang: z.string().min(2).max(5),
  niche: z.string().max(40),
  age: z.string().max(20),
  title: z.string().max(200).default(""),
  tone: z.string().max(40).optional(),
  creativity: z.number().int().min(1).max(10).optional(),
  interiorText: z.string().max(20000).optional(),
  interiorImages: z.array(dataUrl).max(3).optional(),
  coverImages: z.array(dataUrl).max(2).optional(),
});

export const generateListingCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listingInput.parse(data))
  .handler(async ({ data }) => {
    const { generateListingCopyAi } = await import("@/lib/aiCopy.server");
    try {
      return { ok: true as const, copy: await generateListingCopyAi(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Errore AI" };
    }
  });

export const generateAplusCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => aplusInput.parse(data))
  .handler(async ({ data }) => {
    const { generateAplusCopyAi } = await import("@/lib/aiCopy.server");
    try {
      return { ok: true as const, copy: await generateAplusCopyAi(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Errore AI" };
    }
  });

const blurbInput = z.object({
  locale: z.string().min(2).max(5),
  title: z.string().max(200),
  genre: z.string().max(60),
  protagonist: z.string().max(400),
  setting: z.string().max(400).optional(),
  conflict: z.string().max(600),
  stakes: z.string().max(400).optional(),
  tone: z.string().max(40).optional(),
  creativity: z.number().int().min(1).max(10).optional(),
  interiorText: z.string().max(20000).optional(),
  interiorImages: z.array(dataUrl).max(3).optional(),
  coverImages: z.array(dataUrl).max(2).optional(),
});

const bioInput = z.object({
  locale: z.string().min(2).max(5),
  authorName: z.string().max(120),
  niche: z.string().max(200),
  achievements: z.string().max(600).optional(),
  personalTouch: z.string().max(400).optional(),
  tone: z.string().max(40).optional(),
  creativity: z.number().int().min(1).max(10).optional(),
  bookTitle: z.string().max(200).optional(),
  releaseInfo: z.string().max(120).optional(),
  links: z.string().max(300).optional(),
  interiorText: z.string().max(20000).optional(),
  interiorImages: z.array(dataUrl).max(3).optional(),
  coverImages: z.array(dataUrl).max(2).optional(),
});

const promoInput = z.object({
  locale: z.string().min(2).max(5),
  bookTitle: z.string().max(200),
  genre: z.string().max(60).optional(),
  usp: z.string().max(600),
  audience: z.string().max(200),
  cta: z.string().max(200).optional(),
  platforms: z.array(z.string().max(20)).min(1).max(4),
  tone: z.string().max(40).optional(),
  creativity: z.number().int().min(1).max(10).optional(),
  interiorText: z.string().max(20000).optional(),
  interiorImages: z.array(dataUrl).max(3).optional(),
  coverImages: z.array(dataUrl).max(2).optional(),
});

export const generateBlurbCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => blurbInput.parse(data))
  .handler(async ({ data }) => {
    const { generateBlurbCopyAi } = await import("@/lib/aiCopy.server");
    try {
      return { ok: true as const, copy: await generateBlurbCopyAi(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Errore AI" };
    }
  });

export const generateBioCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bioInput.parse(data))
  .handler(async ({ data }) => {
    const { generateBioCopyAi } = await import("@/lib/aiCopy.server");
    try {
      return { ok: true as const, copy: await generateBioCopyAi(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Errore AI" };
    }
  });

export const generatePromoCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => promoInput.parse(data))
  .handler(async ({ data }) => {
    const { generatePromoCopyAi } = await import("@/lib/aiCopy.server");
    try {
      return { ok: true as const, copy: await generatePromoCopyAi(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Errore AI" };
    }
  });

const triageInput = z.object({
  locale: z.string().min(2).max(5),
  imageDataUrl: dataUrl,
});

export const analyzeTriageImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => triageInput.parse(data))
  .handler(async ({ data }) => {
    const { analyzeTriageImageAi } = await import("@/lib/aiCopy.server");
    try {
      return { ok: true as const, suggestion: await analyzeTriageImageAi(data) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "Errore AI" };
    }
  });
