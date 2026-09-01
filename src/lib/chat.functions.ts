import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { buildHelpChatSystemPrompt, getHelpChatReply } from "@/lib/aiChat.server";
import { LOCALE_META, isLocale } from "@/lib/i18n/config";
import { logger } from "@/lib/logger.server";
import { enforceRateLimit } from "@/lib/rateLimit.server";

const RATE_LIMIT_MESSAGE = "Troppe richieste. Riprova tra qualche istante.";

const chatInput = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(12)
    .default([]),
  locale: z.string().max(10).optional(),
});

/** Chiave di rate limit dal client: IP dietro Cloudflare, con fallback per lo sviluppo locale. */
function clientIp(): string {
  const headers = getRequest()?.headers;
  return (
    headers?.get("cf-connecting-ip") ??
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Chatbot di aiuto pubblico (nessuna autenticazione richiesta: deve funzionare
 * anche per chi visita la landing prima di registrarsi). Rate limit per IP,
 * non per utente: qui non c'è un middleware di auth da cui leggere lo user id.
 */
export const sendHelpChatMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatInput.parse(data))
  .handler(async ({ data }) => {
    const ip = clientIp();
    try {
      await enforceRateLimit(`help-chat:${ip}`, { maxHits: 20, windowSeconds: 3600 });
    } catch (error) {
      // Solo il messaggio di limite superato è sicuro da mostrare nella chat: qualunque altro
      // errore (es. infrastrutturale) non deve mai comparire come testo grezzo all'utente.
      if (error instanceof Error && error.message === RATE_LIMIT_MESSAGE) throw error;
      logger.error("chat: rate limit non disponibile", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Il servizio non è al momento disponibile. Riprova più tardi.");
    }

    const localeLabel = isLocale(data.locale) ? LOCALE_META[data.locale].label : "Italiano";
    const systemPrompt = buildHelpChatSystemPrompt(localeLabel);

    const reply = await getHelpChatReply({
      systemPrompt,
      message: data.message,
      history: data.history,
    });

    return { reply };
  });
