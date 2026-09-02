import { DPI } from "./constants";

/**
 * Importa un PDF già impaginato (es. un vecchio interno, o pagine disegnate altrove) come
 * elenco di pagine-immagine di Interni: ogni pagina del PDF diventa un File PNG a piena
 * risoluzione di stampa, pronto per essere trattato come un normale upload manuale (stesso
 * `InteriorPage.kind === "image"`, nessuna modifica necessaria al motore di rendering/export).
 */

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

export async function extractPdfPagesAsImages(
  file: File,
  onProgress?: (done: number, total: number) => void,
): Promise<File[]> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const total = pdf.numPages;
  const stem = file.name.replace(/\.pdf$/i, "") || "pagina";

  // 1 punto PDF = 1/72": scala per ottenere i 300 DPI richiesti da KDP, indipendentemente
  // dal formato pagina originale del PDF sorgente.
  const scale = DPI / 72;

  const files: File[] = [];
  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Impossibile creare il contesto di rendering per il PDF.");
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error(`Impossibile convertire la pagina ${i} in immagine.`)),
        "image/png",
      );
    });
    files.push(
      new File([blob], `${stem}_p${String(i).padStart(3, "0")}.png`, { type: "image/png" }),
    );
    onProgress?.(i, total);
  }

  return files;
}
