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
    },
  };
}

export function planSlugForVariant(variantId: string | number | null | undefined): string | null {
  const id = String(variantId ?? "");
  const { variants } = readLemonConfig();
  const found = Object.entries(variants).find(([, v]) => v && v === id);
  return found ? found[0] : null;
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

  const body = (await res.json().catch(() => null)) as
    | { data?: unknown; errors?: { detail?: string }[] }
    | null;

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
}): Promise<string> {
  const { storeId, variants } = readLemonConfig();
  const variantId = variants[opts.planSlug];
  if (!storeId || !variantId) {
    throw new Error(
      "Lemon Squeezy non è ancora configurato: manca lo Store ID o il Variant ID del piano.",
    );
  }

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
            custom: { user_id: opts.userId, plan_slug: opts.planSlug },
          },
          product_options: { redirect_url: opts.redirectUrl, enabled_variants: [Number(variantId)] },
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
    body?.data as { attributes?: { urls?: { update_payment_method?: string; customer_portal?: string } } }
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
