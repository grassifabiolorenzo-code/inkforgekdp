/**
 * Micro-cache in memoria di processo, con TTL. Vive solo nell'isolate
 * Cloudflare Workers che lo esegue (nessuna garanzia di condivisione tra
 * isolate/edge diversi): riduce il carico sul database per richieste
 * ravvicinate sullo stesso isolate "caldo", senza pretendere di essere una
 * cache distribuita — per quello servirebbe KV/Durable Objects, non
 * necessario alla scala attuale.
 *
 * Deliberatamente NON usiamo Cache-Control/l'edge cache di Cloudflare per
 * dati admin: un header "public" farebbe rispondere l'edge PRIMA che il
 * middleware di autenticazione/RBAC giri, esponendo dati (es. MRR, revenue)
 * a chiunque indovini l'URL. Questa cache gira sempre dopo l'autorizzazione.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function memoize<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  const cached = store.get(key) as Entry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await compute();
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
}
