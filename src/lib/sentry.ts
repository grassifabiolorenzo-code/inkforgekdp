/**
 * Reporter minimale verso Sentry (o qualunque backend compatibile con l'API
 * "store" di Sentry), senza dipendere dall'SDK ufficiale: l'SDK Node/browser
 * di Sentry non è garantito compatibile con il runtime Cloudflare Workers su
 * cui gira il server (vedi wrangler.json generato dalla build), mentre questa
 * implementazione usa solo `fetch`, disponibile ovunque.
 *
 * Se SENTRY_DSN (server) / VITE_SENTRY_DSN (client) non è configurato, ogni
 * chiamata è un no-op silenzioso: nessun errore di configurazione mancante,
 * coerente con il resto del progetto (es. getBillingConfigStatus).
 */

interface ParsedDsn {
  publicKey: string;
  host: string;
  projectId: string;
}

export function parseDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !projectId) return null;
    return { publicKey: url.username, host: url.host, projectId };
  } catch {
    return null;
  }
}

function readDsn(): string | null {
  // Lato client, import.meta.env; lato server, process.env. Nessuno dei due
  // esiste sempre nell'altro contesto, da qui i controlli difensivi.
  if (typeof window !== "undefined") {
    return (import.meta.env?.["VITE_SENTRY_DSN"] as string | undefined) ?? null;
  }
  return process.env?.["SENTRY_DSN"] ?? null;
}

function randomEventId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Invia un errore a Sentry. Fire-and-forget: non va mai atteso (`void`) e non
 * deve mai interrompere il flusso chiamante — un fallimento di rete verso
 * Sentry non è mai motivo per far fallire una request reale.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  const dsn = readDsn();
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const isError = error instanceof Error;
  const message = isError ? error.message : String(error);
  const stack = isError ? error.stack : undefined;

  const payload = {
    event_id: randomEventId(),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "error",
    environment:
      (typeof window === "undefined" ? process.env?.["NODE_ENV"] : import.meta.env?.["MODE"]) ??
      "production",
    logger: "inkforgekdp",
    message: { formatted: message },
    exception: isError
      ? {
          values: [
            {
              type: error.name || "Error",
              value: message,
              stacktrace: stack ? { frames: parseStackFrames(stack) } : undefined,
            },
          ],
        }
      : undefined,
    extra: context,
    request: typeof window !== "undefined" ? { url: window.location.href } : undefined,
  };

  const endpoint = `https://${parsed.host}/api/${parsed.projectId}/store/`;
  const authHeader = `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=inkforgekdp-fetch/1.0`;

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Sentry-Auth": authHeader },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Mai propagare un errore di reporting: sarebbe peggio del problema originale.
  });
}

/** Parsing molto semplice di uno stacktrace JS in frame Sentry-compatibili ("function (file:line:col)"). */
function parseStackFrames(
  stack: string,
): { filename: string; function: string; lineno?: number; colno?: number }[] {
  const lines = stack.split("\n").slice(1, 30);
  const frames = lines.map((line) => {
    const match = /at\s+(?:(.*?)\s+\()?(.*?):(\d+):(\d+)\)?$/.exec(line.trim());
    if (!match) return { filename: line.trim(), function: "?" };
    const [, fn, file, ln, col] = match;
    return {
      filename: file ?? "?",
      function: fn ?? "anonymous",
      lineno: Number(ln),
      colno: Number(col),
    };
  });
  return frames.reverse();
}
