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
  interiorText: z.string().max(20000).optional(),
  interiorImages: z.array(dataUrl).max(3).optional(),
  coverImages: z.array(dataUrl).max(2).optional(),
});

const aplusInput = z.object({
  lang: z.string().min(2).max(5),
  niche: z.string().max(40),
  age: z.string().max(20),
  title: z.string().max(200).default(""),
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
