/**
 * Dominio pubblico dell'app: stesso placeholder già usato in public/sitemap.xml
 * e nell'esempio di PUBLIC_APP_URL in .env.example. Aggiorna qui (e negli altri
 * due punti) non appena il dominio reale è confermato — usato per canonical,
 * og:url e i campi "url" dei dati strutturati.
 */
export const SITE_URL = "https://app.inkforgekdp.com";

export function canonicalUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean === "/" ? "" : clean}`;
}
