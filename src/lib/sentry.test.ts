import { describe, expect, it } from "vitest";

import { parseDsn } from "./sentry";

describe("sentry.parseDsn", () => {
  it("estrae publicKey, host e projectId da un DSN Sentry valido", () => {
    const parsed = parseDsn("https://abc123@o447951.ingest.sentry.io/1234567");
    expect(parsed).toEqual({
      publicKey: "abc123",
      host: "o447951.ingest.sentry.io",
      projectId: "1234567",
    });
  });

  it("ritorna null per un DSN senza chiave pubblica", () => {
    expect(parseDsn("https://o447951.ingest.sentry.io/1234567")).toBeNull();
  });

  it("ritorna null per un DSN senza project id nel path", () => {
    expect(parseDsn("https://abc123@o447951.ingest.sentry.io/")).toBeNull();
  });

  it("ritorna null per una stringa non-URL", () => {
    expect(parseDsn("non-un-url")).toBeNull();
  });
});
