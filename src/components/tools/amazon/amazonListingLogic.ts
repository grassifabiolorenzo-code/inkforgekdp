/**
 * TOOL 5 — Amazon Marketplace.
 * Modello dati e helper di export per la scheda prodotto Amazon Marketplace
 * (catalogo generico, non solo libri KDP). L'utente compila liberamente ogni
 * campo e può aggiungere tutte le immagini (via URL) e gli attributi
 * personalizzati ("specifiche") di cui ha bisogno: non c'è alcun limite
 * imposto lato UI.
 */

let uid = 0;
/** Id incrementale stabile per le righe dinamiche (immagini, specifiche, bullet). */
export function nextId(prefix: string) {
  uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${uid}`;
}

export interface AmazonImageEntry {
  id: string;
  url: string;
  alt: string;
}

export interface AmazonSpecific {
  id: string;
  key: string;
  value: string;
}

export interface AmazonListing {
  productName: string;
  brand: string;
  manufacturer: string;
  category: string;
  sku: string;
  price: string;
  currency: string;
  bulletPoints: string[];
  description: string;
  searchTerms: string;
  images: AmazonImageEntry[];
  specifics: AmazonSpecific[];
}

export function createEmptyListing(): AmazonListing {
  return {
    productName: "",
    brand: "",
    manufacturer: "",
    category: "",
    sku: "",
    price: "",
    currency: "EUR",
    bulletPoints: ["", "", "", "", ""],
    description: "",
    searchTerms: "",
    images: [{ id: nextId("img"), url: "", alt: "" }],
    specifics: [{ id: nextId("spec"), key: "", value: "" }],
  };
}

/** Righe compilate (per contatori, badge di completezza, ecc.). */
export function filledBulletPoints(listing: AmazonListing) {
  return listing.bulletPoints.filter((b) => b.trim().length > 0);
}

export function filledImages(listing: AmazonListing) {
  return listing.images.filter((img) => img.url.trim().length > 0);
}

export function filledSpecifics(listing: AmazonListing) {
  return listing.specifics.filter((s) => s.key.trim().length > 0 && s.value.trim().length > 0);
}

/** Export testuale pronto da incollare nel form di Seller Central / Amazon Marketplace. */
export function formatAmazonListingForExport(listing: AmazonListing): string {
  const lines: string[] = [];

  lines.push("=== SCHEDA PRODOTTO — AMAZON MARKETPLACE ===", "");
  lines.push(`Titolo prodotto: ${listing.productName || "-"}`);
  lines.push(`Brand: ${listing.brand || "-"}`);
  if (listing.manufacturer) lines.push(`Produttore: ${listing.manufacturer}`);
  lines.push(`Categoria: ${listing.category || "-"}`);
  if (listing.sku) lines.push(`SKU: ${listing.sku}`);
  if (listing.price) lines.push(`Prezzo: ${listing.price} ${listing.currency}`);
  lines.push("");

  const bullets = filledBulletPoints(listing);
  lines.push(`--- Bullet point (${bullets.length}) ---`);
  bullets.forEach((b, i) => lines.push(`${i + 1}. ${b}`));
  lines.push("");

  lines.push("--- Descrizione prodotto ---");
  lines.push(listing.description || "-");
  lines.push("");

  lines.push("--- Search term / keyword backend ---");
  lines.push(listing.searchTerms || "-");
  lines.push("");

  const images = filledImages(listing);
  lines.push(`--- Immagini (${images.length}) ---`);
  images.forEach((img, i) => lines.push(`${i + 1}. ${img.url}${img.alt ? ` — alt: ${img.alt}` : ""}`));
  lines.push("");

  const specifics = filledSpecifics(listing);
  lines.push(`--- Specifiche / attributi personalizzati (${specifics.length}) ---`);
  specifics.forEach((s) => lines.push(`${s.key}: ${s.value}`));

  return lines.join("\n");
}

/** Export strutturato in JSON, utile per import via foglio di calcolo o API. */
export function amazonListingToJson(listing: AmazonListing): string {
  const payload = {
    productName: listing.productName,
    brand: listing.brand,
    manufacturer: listing.manufacturer || undefined,
    category: listing.category,
    sku: listing.sku || undefined,
    price: listing.price ? { amount: listing.price, currency: listing.currency } : undefined,
    bulletPoints: filledBulletPoints(listing),
    description: listing.description,
    searchTerms: listing.searchTerms,
    images: filledImages(listing).map(({ url, alt }) => ({ url, alt })),
    specifics: Object.fromEntries(filledSpecifics(listing).map((s) => [s.key, s.value])),
  };
  return JSON.stringify(payload, null, 2);
}

export function slugifyFileName(value: string) {
  return (value || "amazon-listing").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
