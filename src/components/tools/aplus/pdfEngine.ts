/** Utility browser-only per rendering PDF (pdfjs) e loghi. Importare pdfjs-dist dinamicamente per restare SSR-safe. */

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

export function isolateLogoBackground(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  c.width = img.naturalWidth || img.width || 300;
  c.height = img.naturalHeight || img.height || 150;
  ctx.drawImage(img, 0, 0, c.width, c.height);

  try {
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i]! > 230 && d[i + 1]! > 230 && d[i + 2]! > 230) {
        d[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Se il canvas è "tainted" per CORS, si mantiene il logo originale.
  }
  return c;
}

export async function loadLogoFromFile(file: File): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(isolateLogoBackground(img));
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

/** Renderizza una pagina PDF su canvas; se `isCover`, ritaglia la metà fronte/retro come nell'app originale. */
export async function renderPdfPage(
  file: File,
  pageNum: number,
  isCover: boolean,
  getBackCover = false,
): Promise<HTMLCanvasElement> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const safePageNum = Math.max(1, Math.min(pageNum, pdf.numPages));
  const page = await pdf.getPage(safePageNum);
  const vp = page.getViewport({ scale: 2.5 });

  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  c.width = Math.ceil(vp.width);
  c.height = Math.ceil(vp.height);

  await page.render({ canvas: c, canvasContext: ctx, viewport: vp }).promise;

  if (isCover && c.width > c.height * 1.25) {
    const halfW = Math.floor(c.width / 2);
    const cropCanvas = document.createElement("canvas");
    const cropCtx = cropCanvas.getContext("2d")!;
    cropCanvas.width = halfW;
    cropCanvas.height = c.height;

    if (getBackCover) {
      cropCtx.drawImage(c, 0, 0, halfW, c.height, 0, 0, halfW, c.height);
    } else {
      cropCtx.drawImage(c, halfW, 0, halfW, c.height, 0, 0, halfW, c.height);
    }
    return cropCanvas;
  }
  return c;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  return pdf.numPages;
}
