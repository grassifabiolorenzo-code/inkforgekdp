/**
 * Interpolazione `{{variabile}}` nei modelli email (soggetto e corpo HTML).
 * Funzione pura, riusata sia dall'invio transazionale/promozionale che dai test.
 * Una variabile mancante nel record `variables` viene sostituita con stringa
 * vuota (mai lasciata come placeholder grezzo in un'email realmente inviata).
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}
