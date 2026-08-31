/**
 * Header di sicurezza applicati a ogni risposta del Worker (vedi server.ts).
 * Non usiamo il file `_headers` generato da Nitro/Cloudflare perché copre solo
 * gli asset statici, non le risposte SSR generate dal nostro `fetch` handler.
 *
 * La CSP consente 'unsafe-inline' per script/style: gli studio standalone in
 * public/tools/*.html (Copertine) dipendono dal Tailwind Play CDN e da
 * WebFont Loader, entrambi basati su iniezione di <style>/<script> a runtime —
 * bloccarli romperebbe il tool. Anche così la CSP resta difesa in profondità
 * reale: restringe connect-src/object-src/frame-ancestors/base-uri, che sono
 * i vettori più pericolosi (exfiltrazione dati, clickjacking, injection di
 * <object>/<embed>).
 *
 * REPORT-ONLY DI PROPOSITO: gli origin consentiti sono stati enumerati da
 * codice (grep su tutte le risorse esterne caricate), non verificati in un
 * browser reale (l'ambiente locale non riesce a eseguire il build Cloudflare
 * per una prova end-to-end). Finché resta "Content-Security-Policy-Report-Only"
 * la policy non blocca nulla: apri la console del browser su ogni tool (in
 * particolare Copertine, che dipende dai CDN esterni elencati sopra) e cerca
 * righe "[Report Only]" — se non ce ne sono dopo un giro completo, passa a
 * CSP_HEADER_NAME = "Content-Security-Policy" per renderla vincolante.
 */
const CSP_HEADER_NAME = "Content-Security-Policy-Report-Only";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://ajax.googleapis.com https://cdnjs.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
  "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  [CSP_HEADER_NAME]: CSP,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

/**
 * Restituisce una nuova Response con gli header di sicurezza aggiunti, senza
 * assumere che gli header della Response originale siano mutabili (non lo
 * sono sempre in ambiente Workers).
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
