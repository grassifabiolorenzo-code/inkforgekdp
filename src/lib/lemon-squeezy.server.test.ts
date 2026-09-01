import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyWebhookSignature } from "./lemon-squeezy.server";

const SECRET = "test-webhook-secret";
const BODY = JSON.stringify({ meta: { event_name: "subscription_created" }, data: { id: "123" } });

/** Firma di riferimento calcolata in modo indipendente da Node (non riusa il codice sotto test). */
function referenceSignature(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature — sicurezza del webhook Lemon Squeezy", () => {
  const originalSecret = process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"];

  beforeEach(() => {
    process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"] = SECRET;
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"];
    else process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"] = originalSecret;
  });

  it("accetta una firma HMAC-SHA256 corretta", async () => {
    const signature = referenceSignature(SECRET, BODY);
    await expect(verifyWebhookSignature(BODY, signature)).resolves.toBe(true);
  });

  it("rifiuta una firma manomessa (un solo carattere diverso)", async () => {
    const signature = referenceSignature(SECRET, BODY);
    const tampered = signature.slice(0, -1) + (signature.at(-1) === "0" ? "1" : "0");
    await expect(verifyWebhookSignature(BODY, tampered)).resolves.toBe(false);
  });

  it("rifiuta una firma calcolata con un body diverso (payload manomesso)", async () => {
    const signature = referenceSignature(SECRET, BODY);
    const tamperedBody = BODY.replace("subscription_created", "subscription_cancelled");
    await expect(verifyWebhookSignature(tamperedBody, signature)).resolves.toBe(false);
  });

  it("rifiuta una firma calcolata con il secret sbagliato", async () => {
    const signature = referenceSignature("secret-diverso", BODY);
    await expect(verifyWebhookSignature(BODY, signature)).resolves.toBe(false);
  });

  it("rifiuta l'assenza di una firma, senza sollevare eccezioni", async () => {
    await expect(verifyWebhookSignature(BODY, null)).resolves.toBe(false);
  });

  it("rifiuta una firma di lunghezza diversa (nessun crash sul confronto)", async () => {
    await expect(verifyWebhookSignature(BODY, "troppo-corta")).resolves.toBe(false);
  });

  it("solleva un errore esplicito se il secret non è configurato — mai un fail-open silenzioso", async () => {
    delete process.env["LEMON_SQUEEZY_WEBHOOK_SECRET"];
    const signature = referenceSignature(SECRET, BODY);
    await expect(verifyWebhookSignature(BODY, signature)).rejects.toThrow(
      "LEMON_SQUEEZY_WEBHOOK_SECRET non configurato",
    );
  });
});
