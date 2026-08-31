/**
 * Costruzione dell'archivio ZIP di output del Triage.
 * Replica la logica dell'app originale: le immagini Promosse vengono
 * suddivise in cartelle "Libro_N" da `batchSize` immagini l'una, con
 * l'eventuale resto raccolto in "Libro_x". Rimandate e Bocciate finiscono
 * ciascuna nella propria cartella, con i file rinominati progressivamente.
 */

/**
 * Etichette cartelle/report per lingua di output. `approved`/`pending`/`rejected` sono al
 * singolare (coerenti col prototipo originale "PROMOSSA/RIMANDATA/BOCCIATA") e diventano i
 * nomi delle 3 cartelle generate nello ZIP, con prefisso numerico 1/2/3 aggiunto in
 * `buildTriageZip` per rendere esplicito l'ordine (Promossa, Rimandata, Bocciata).
 */
const ZIP_LABELS = {
  it: { approved: "Promossa", pending: "Rimandata", rejected: "Bocciata", book: "Libro", title: "Riepilogo Triage KDP", date: "Data", threshold: "Soglia pagine per cartella", folders: "cartelle complete", extra: "cartella resto" },
  en: { approved: "Approved", pending: "Pending", rejected: "Rejected", book: "Book", title: "KDP Triage Summary", date: "Date", threshold: "Pages per folder", folders: "complete folders", extra: "remainder folder" },
  de: { approved: "Freigegeben", pending: "Zurueckgestellt", rejected: "Abgelehnt", book: "Buch", title: "KDP Triage Zusammenfassung", date: "Datum", threshold: "Seiten pro Ordner", folders: "vollstaendige Ordner", extra: "Restordner" },
  fr: { approved: "Validee", pending: "En attente", rejected: "Refusee", book: "Livre", title: "Resume Triage KDP", date: "Date", threshold: "Pages par dossier", folders: "dossiers complets", extra: "dossier restant" },
  es: { approved: "Aprobada", pending: "Pendiente", rejected: "Rechazada", book: "Libro", title: "Resumen Triage KDP", date: "Fecha", threshold: "Paginas por carpeta", folders: "carpetas completas", extra: "carpeta restante" },
  nl: { approved: "Goedgekeurd", pending: "In afwachting", rejected: "Afgewezen", book: "Boek", title: "KDP Triage Samenvatting", date: "Datum", threshold: "Paginas per map", folders: "volledige mappen", extra: "restmap" },
  pt: { approved: "Aprovada", pending: "Pendente", rejected: "Rejeitada", book: "Livro", title: "Resumo Triage KDP", date: "Data", threshold: "Paginas por pasta", folders: "pastas completas", extra: "pasta restante" },
} as const;

export type TriageZipLocale = keyof typeof ZIP_LABELS;

export interface TriageResult {
  promosse: File[];
  rimandate: File[];
  bocciate: File[];
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : ".png";
}

function paddedName(index: number, extension: string): string {
  return `img_${String(index).padStart(2, "0")}${extension}`;
}

function buildReport(
  result: TriageResult,
  batchSize: number,
  fullBooksCount: number,
  remainder: number,
  locale: TriageZipLocale,
): string {
  const L = ZIP_LABELS[locale];
  const lines = [
    L.title,
    "=====================",
    `${L.date}: ${new Date().toLocaleString(locale)}`,
    `${L.threshold}: ${batchSize}`,
    "",
    `${L.approved}: ${result.promosse.length} (${fullBooksCount} ${L.folders}${remainder > 0 ? ` + 1 ${L.extra}` : ""})`,
    `${L.pending}: ${result.rimandate.length}`,
    `${L.rejected}: ${result.bocciate.length}`,
  ];
  return lines.join("\n");
}

export async function buildTriageZip(
  result: TriageResult,
  batchSize: number,
  locale: TriageZipLocale = "it",
): Promise<Blob> {
  const L = ZIP_LABELS[locale];
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const folderPromossa = zip.folder(`1 ${L.approved}`);
  const totalPromosse = result.promosse.length;
  const fullBooksCount = Math.floor(totalPromosse / batchSize);
  const remainder = totalPromosse % batchSize;

  let fileIndex = 0;
  for (let b = 1; b <= fullBooksCount; b++) {
    const bookFolder = folderPromossa?.folder(`${L.book}_${b}`);
    for (let i = 0; i < batchSize; i++) {
      const file = result.promosse[fileIndex];
      if (file) bookFolder?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
      fileIndex++;
    }
  }
  if (remainder > 0) {
    const bookXFolder = folderPromossa?.folder(`${L.book}_x`);
    for (let i = 0; i < remainder; i++) {
      const file = result.promosse[fileIndex];
      if (file) bookXFolder?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
      fileIndex++;
    }
  }

  const folderRimandata = zip.folder(`2 ${L.pending}`);
  for (let i = 0; i < result.rimandate.length; i++) {
    const file = result.rimandate[i];
    if (file) folderRimandata?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
  }

  const folderBocciata = zip.folder(`3 ${L.rejected}`);
  for (let i = 0; i < result.bocciate.length; i++) {
    const file = result.bocciate[i];
    if (file) folderBocciata?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
  }

  zip.file("report.txt", buildReport(result, batchSize, fullBooksCount, remainder, locale));

  return zip.generateAsync({ type: "blob" });
}
