import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Route } from "./lemon-squeezy.webhook";

const SECRET = "test-webhook-secret";

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

type PostHandler = (ctx: { request: Request }) => Promise<Response>;
const handlers = Route.options.server!.handlers as unknown as { POST: PostHandler };

function postWebhook(body: string, signature: string | null): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature !== null) headers.set("x-signature", signature);
  const request = new Request("http://localhost/api/public/lemon-squeezy/webhook", {
    method: "POST",
    headers,
    body,
  });
  return handlers.POST({ request });
}

/**
 * Verifica solo il "cancello" di sicurezza in cima all'handler: la firma va controllata
 * PRIMA di qualunque accesso al database. SUPABASE_SERVICE_ROLE_KEY resta deliberatamente
 * non configurata in questo test — se qualcuno spostasse un accesso a supabaseAdmin prima
 * del controllo firma, questi test fallirebbero con un errore di configurazione invece che
 * con l'esito atteso, rendendo la regressione impossibile da non notare.
 */
describe("webhook Lemon Squeezy — cancello di sicurezza", () => {
  const originalSecret = process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"];
  const originalServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  beforeEach(() => {
    process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"] = SECRET;
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"];
    else process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"] = originalSecret;
    if (originalServiceKey === undefined) delete process.env["SUPABASE_SERVICE_ROLE_KEY"];
    else process.env["SUPABASE_SERVICE_ROLE_KEY"] = originalServiceKey;
  });

  it("rifiuta con 401 una firma non valida, senza toccare il database", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await postWebhook(body, "firma-non-valida");
    expect(res.status).toBe(401);
  });

  it("rifiuta con 401 una richiesta senza intestazione della firma", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await postWebhook(body, null);
    expect(res.status).toBe(401);
  });

  it("rifiuta con 400 un corpo non JSON anche a firma corretta", async () => {
    const body = "non è json";
    const res = await postWebhook(body, sign(body));
    expect(res.status).toBe(400);
  });

  it("con firma corretta ignora (200) un evento sconosciuto, senza toccare il database", async () => {
    const body = JSON.stringify({ meta: { event_name: "un_evento_che_non_esiste_ancora" } });
    const res = await postWebhook(body, sign(body));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ignored");
  });
});
