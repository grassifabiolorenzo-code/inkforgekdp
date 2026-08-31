/**
 * Logging strutturato minimale. Il runtime di produzione è Cloudflare Workers
 * (vedi wrangler.json generato dalla build): non esiste un filesystem persistente
 * per un logger classico (pino/winston con transport su file), ma ogni riga
 * scritta su console.* è già raccolta da Cloudflare (dashboard "Logs" / `wrangler
 * tail`) — la differenza che conta è che sia JSON strutturato e non testo libero,
 * così diventa filtrabile/interrogabile invece che solo leggibile a occhio.
 *
 * File `.server.ts`: mai incluso nel bundle client.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => write("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
};
