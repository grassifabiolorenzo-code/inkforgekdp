/**
 * Analisi reale del PDF interno tramite pdfjs-dist (solo lato browser).
 * Renderizza ogni pagina su un canvas offscreen per verificarne l'integrità,
 * replicando il comportamento dell'app standalone originale.
 */

export interface InteriorAnalysisResult {
  scanned: boolean;
  totalPages: number;
  errorsFound: string[];
}

export async function analyzeInteriorPdf(file: File): Promise<InteriorAnalysisResult> {
  if (typeof window === "undefined") {
    return { scanned: false, totalPages: 0, errorsFound: ["Analisi disponibile solo nel browser."] };
  }

  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const result: InteriorAnalysisResult = { scanned: false, totalPages: 0, errorsFound: [] };

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  result.totalPages = pdfDoc.numPages;

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    if (!context) {
      result.errorsFound.push(`Pagina ${i}: impossibile creare il contesto di rendering.`);
      continue;
    }
    await page.render({ canvas, canvasContext: context, viewport }).promise;
  }

  result.scanned = true;
  return result;
}
