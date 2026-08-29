/**
 * Costruzione dell'archivio ZIP di output del Triage.
 * Replica la logica dell'app originale: le immagini Promosse vengono
 * suddivise in cartelle "Libro_N" da `batchSize` immagini l'una, con
 * l'eventuale resto raccolto in "Libro_x". Rimandate e Bocciate finiscono
 * ciascuna nella propria cartella, con i file rinominati progressivamente.
 */

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

function buildReport(result: TriageResult, batchSize: number, fullBooksCount: number, remainder: number): string {
  const lines = [
    "Riepilogo Triage KDP",
    "=====================",
    `Data: ${new Date().toLocaleString("it-IT")}`,
    `Soglia pagine per cartella: ${batchSize}`,
    "",
    `Promosse: ${result.promosse.length} (${fullBooksCount} cartelle Libro_ complete${remainder > 0 ? " + 1 cartella Libro_x" : ""})`,
    `Rimandate: ${result.rimandate.length}`,
    `Bocciate: ${result.bocciate.length}`,
  ];
  return lines.join("\n");
}

export async function buildTriageZip(result: TriageResult, batchSize: number): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const folderPromossa = zip.folder("PROMOSSA");
  const totalPromosse = result.promosse.length;
  const fullBooksCount = Math.floor(totalPromosse / batchSize);
  const remainder = totalPromosse % batchSize;

  let fileIndex = 0;
  for (let b = 1; b <= fullBooksCount; b++) {
    const bookFolder = folderPromossa?.folder(`Libro_${b}`);
    for (let i = 0; i < batchSize; i++) {
      const file = result.promosse[fileIndex];
      if (file) bookFolder?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
      fileIndex++;
    }
  }
  if (remainder > 0) {
    const bookXFolder = folderPromossa?.folder("Libro_x");
    for (let i = 0; i < remainder; i++) {
      const file = result.promosse[fileIndex];
      if (file) bookXFolder?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
      fileIndex++;
    }
  }

  const folderRimandata = zip.folder("RIMANDATA");
  for (let i = 0; i < result.rimandate.length; i++) {
    const file = result.rimandate[i];
    if (file) folderRimandata?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
  }

  const folderBocciata = zip.folder("BOCCIATA");
  for (let i = 0; i < result.bocciate.length; i++) {
    const file = result.bocciate[i];
    if (file) folderBocciata?.file(paddedName(i + 1, extensionOf(file.name)), await file.arrayBuffer());
  }

  zip.file("report.txt", buildReport(result, batchSize, fullBooksCount, remainder));

  return zip.generateAsync({ type: "blob" });
}
