import { describe, expect, it } from "vitest";

import { withSecurityHeaders } from "./security-headers";

describe("withSecurityHeaders", () => {
  it("aggiunge gli header di sicurezza principali senza alterare status/body", async () => {
    const original = new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });

    const result = withSecurityHeaders(original);

    expect(result.status).toBe(200);
    expect(await result.text()).toBe("<html></html>");
    expect(result.headers.get("content-type")).toBe("text/html");
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(result.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(result.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(result.headers.get("Content-Security-Policy-Report-Only")).toContain(
      "default-src 'self'",
    );
  });

  it("non muta l'oggetto Response originale", () => {
    const original = new Response("ok");
    withSecurityHeaders(original);
    expect(original.headers.get("Content-Security-Policy-Report-Only")).toBeNull();
  });

  it("preserva lo status code sulle risposte di errore", async () => {
    const original = new Response("not found", { status: 404 });
    const result = withSecurityHeaders(original);
    expect(result.status).toBe(404);
  });
});
