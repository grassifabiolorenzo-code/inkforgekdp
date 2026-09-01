/**
 * Client server-only per Lemon Squeezy.
 * Le chiavi private vivono esclusivamente in variabili d'ambiente server-side.
 *
 * Variabili richieste:
 *  - LEMON_SQUEEZY_API_KEY
 *  - LEMON_SQUEEZY_STORE_ID
 *  - LEMON_SQUEEZY_WEBHOOK_SECRET
 *  - LEMON_SQUEEZY_STARTER_VARIANT_ID
 *  - LEMON_SQUEEZY_PRO_VARIANT_ID
 *  - LEMON_SQUEEZY_BUSINESS_VARIANT_ID
 */

const API_BASE = "https://api.lemonsqueezy.com/v1";

export interface LemonConfig {
  apiKey: string;
  storeId: string;
  variants: Record<string, string>;
}

export function readLemonConfig(): LemonConfig {
  return {
    apiKey: process.env["LEMON_SQUEEZY_API_KEY"] ?? "",
    storeId: process.env["LEMON_SQUEEZY_STORE_ID"] ?? "",
    variants: {
      starter: process.env["LEMON_SQUEEZY_STARTER_VARIANT_ID"] ?? "",
      pro: process.env["LEMON_SQUEEZY_PRO_VARIANT_ID"] ?? "",
      business: process.env["LEMON_SQUEEZY_BUSINESS_VARIANT_ID"] ?? "",
      // Prodotto "one-time" (non abbonamento) per il pacchetto da 10 crediti extra.
      credits10: process.env["LEMON_SQUEEZY_CREDITPACK10_VARIANT_ID"] ?? "",
    },
  };
}

/** Stato di configurazione dei pagamenti (senza esporre valori sensibili). */
export interface BillingConfigStatus {
  ready: boolean;
  apiKey: boolean;
  storeId: boolean;
  webhookSecret: boolean;
  variants: Record<"starter" | "pro" | "business", boolean>;
  /** Configurazione del pacchetto crediti extra, separata: non blocca gli abbonamenti se manca. */
  creditPackReady: boolean;
}

export function getBillingConfigStatus(): BillingConfigStatus {
  const config = readLemonConfig();
  const variants = {
    starter: Boolean(config.variants["starter"]),
    pro: Boolean(config.variants["pro"]),
    business: Boolean(config.variants["business"]),
  };
  const apiKey = Boolean(config.apiKey);
  const storeId = Boolean(config.storeId);
  return {
    apiKey,
    storeId,
    webhookSecret: Boolean(process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"]),
    variants,
    ready: apiKey && storeId && variants.starter && variants.pro && variants.business,
    creditPackReady: apiKey && storeId && Boolean(config.variants["credits10"]),
  };
}

export function planSlugForVariant(variantId: string | number | null | undefined): string | null {
  const id = String(variantId ?? "");
  const { variants } = readLemonConfig();
  const found = Object.entries(variants).find(([, v]) => v && v === id);
  return found ? found[0] : null;
}

/**
 * Mappa prezzo→variant per il prezzo Pro dinamico del referral ("35" → id
 * variant a €35, "34" → id variant a €34, ... "0" → id variant a €0). Un solo
 * env var JSON invece di 36 variabili separate. Finché non è configurato (o
 * manca il variant per un prezzo specifico), il sistema registra il prezzo
 * calcolato ma NON tenta l'aggiornamento reale su Lemon Squeezy — vedi
 * referral.server.ts: pending_sync resta true e si riprova al prossimo evento,
 * mai un errore bloccante per l'utente.
 */
export function readProReferralPriceVariants(): Record<string, string> {
  const raw = process.env["LEMON_SQUEEZY_PRO_REFERRAL_PRICE_VARIANTS"];
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    console.error("[lemon-squeezy] LEMON_SQUEEZY_PRO_REFERRAL_PRICE_VARIANTS non è un JSON valido");
    return {};
  }
}

/**
 * Codice sconto Lemon Squeezy per il 30% sul primo mese dei nuovi utenti
 * arrivati da referral. Va creato una tantum sul dashboard Lemon Squeezy
 * (percentuale 30%, durata "once", applicabile ai piani a pagamento) — non
 * generato da questo codice. Se non configurato, il checkout procede
 * normalmente senza sconto (mai un errore per l'utente).
 */
export function getReferralDiscountCode(): string | null {
  return process.env["LEMON_SQUEEZY_REFERRAL_DISCOUNT_CODE"] || null;
}

async function lemonFetch(path: string, init: RequestInit = {}) {
  const { apiKey } = readLemonConfig();
  if (!apiKey) throw new Error("LEMON_SQUEEZY_API_KEY non configurata");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => null)) as {
    data?: unknown;
    errors?: { detail?: string }[];
  } | null;

  if (!res.ok) {
    const detail = body?.errors?.[0]?.detail ?? `HTTP ${res.status}`;
    throw new Error(`Lemon Squeezy: ${detail}`);
  }
  return body;
}

export async function createCheckoutUrl(opts: {
  planSlug: string;
  email: string | null;
  userId: string;
  name?: string | null;
  redirectUrl: string;
  /** Campi extra propagati nel custom_data del webhook (es. per distinguere acquisti one-time). */
  extraCustomData?: Record<string, string>;
  /**
   * Codice sconto da applicare al checkout (es. il 30% primo mese da referral).
   * NOTA: il nome campo "discount_code" sotto checkout_data segue la
   * documentazione Lemon Squeezy per l'applicazione di un codice sconto in
   * fase di checkout — verificarlo contro l'account reale prima del lancio,
   * dato che questo progetto non ha ancora un account Lemon Squeezy attivo.
   */
  discountCode?: string;
}): Promise<string | null> {
  const { storeId, variants } = readLemonConfig();
  const variantId = variants[opts.planSlug];
  if (!storeId || !variantId) return null;

  const body = await lemonFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: opts.email ?? undefined,
            name: opts.name ?? undefined,
            // Identifica l'utente nel webhook.
            custom: { user_id: opts.userId, plan_slug: opts.planSlug, ...opts.extraCustomData },
            ...(opts.discountCode ? { discount_code: opts.discountCode } : {}),
          },
          product_options: {
            redirect_url: opts.redirectUrl,
            enabled_variants: [Number(variantId)],
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variantId) } },
        },
      },
    }),
  });

  const url = (body?.data as { attributes?: { url?: string } } | undefined)?.attributes?.url;
  if (!url) throw new Error("Lemon Squeezy: URL di checkout non ricevuto");
  return url;
}

export async function getSubscriptionPortalUrls(subscriptionId: string) {
  const body = await lemonFetch(`/subscriptions/${subscriptionId}`);
  const urls = (
    body?.data as {
      attributes?: { urls?: { update_payment_method?: string; customer_portal?: string } };
    }
  )?.attributes?.urls;
  return {
    customerPortal: urls?.customer_portal ?? null,
    updatePaymentMethod: urls?.update_payment_method ?? null,
  };
}

export async function cancelSubscription(subscriptionId: string) {
  await lemonFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

/** Verifica HMAC-SHA256 della firma del webhook (timing safe). */
export async function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"];
  if (!secret) throw new Error("LEMON_SQUEEZY_WEBHOOK_SECRET non configurato");
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/** Upgrade/downgrade: cambia la variant dell'abbonamento esistente. */
export async function updateSubscriptionVariant(subscriptionId: string, variantId: string) {
  await lemonFetch(`/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "subscriptions",
        id: String(subscriptionId),
        attributes: { variant_id: Number(variantId), invoice_immediately: true },
      },
    }),
  });
}
