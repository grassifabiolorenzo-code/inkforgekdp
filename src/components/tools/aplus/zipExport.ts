import type { GeneratedModulesText } from "./types";

export interface ModuleCanvases {
  hero: HTMLCanvasElement;
  proof: HTMLCanvasElement;
  value: HTMLCanvasElement;
  grid1: HTMLCanvasElement;
  grid2: HTMLCanvasElement;
  grid3: HTMLCanvasElement;
  comp: HTMLCanvasElement;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function heroProofText(t: GeneratedModulesText["hero"]) {
  return `${t.title}\n\nTITOLO A+:\n${t.heading}\n\nTESTO DESCRITTIVO:\n${t.body}\n\nALT-TEXT SEO:\n${t.alt}`;
}

/** Genera lo ZIP finale (immagini + testi) con jszip, importato dinamicamente per restare SSR-safe. */
export async function exportModulesAsZip(
  canvases: ModuleCanvases,
  texts: GeneratedModulesText,
  meta: { title: string; lang: string; niche: string; age: string },
) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const imagesFolder = zip.folder("immagini")!;
  const textsFolder = zip.folder("testi")!;

  const canvasFiles: [HTMLCanvasElement, string][] = [
    [canvases.hero, "Modulo_01_Hero_Banner_970x300.png"],
    [canvases.proof, "Modulo_02_Proof_Banner_970x300.png"],
    [canvases.value, "Modulo_03_Value_Highlights_970x300.png"],
    [canvases.grid1, "Modulo_04_Feature_01_300x300.png"],
    [canvases.grid2, "Modulo_04_Feature_02_300x300.png"],
    [canvases.grid3, "Modulo_04_Feature_03_300x300.png"],
    [canvases.comp, "Modulo_05_Header_Compare_150x300.png"],
  ];

  for (const [canvas, filename] of canvasFiles) {
    const blob = await canvasToBlob(canvas);
    if (blob) imagesFolder.file(filename, blob);
  }

  textsFolder.file("Modulo_01_Hero_Testi.txt", heroProofText(texts.hero));
  textsFolder.file("Modulo_02_Proof_Testi.txt", heroProofText(texts.proof));
  textsFolder.file(
    "Modulo_03_Value_Testi.txt",
    `TITOLO SEZIONE:\n${texts.value.title}\n\nPUNTI CHIAVE:\n1. ${texts.value.text1}\n2. ${texts.value.text2}\n3. ${texts.value.text3}\n\nALT-TEXT SEO:\n${texts.value.alt}`,
  );
  textsFolder.file(
    "Modulo_04_Feature_Testi.txt",
    `TESTI COLONNE A+ (${meta.lang.toUpperCase()} - Target: ${meta.age}):\n\n` +
      texts.grid.items
        .map((g, i) => `• SLOT ${i + 1} (Pag. ${texts.grid.pages[i]}):\n${g.title}\n${g.desc}`)
        .join("\n\n"),
  );
  textsFolder.file(
    "Modulo_05_Compare_Testi.txt",
    `ISTRUZIONI MODULO COMPARATIVO:\n${texts.comp.instructions}\n\nALT-TEXT SEO:\n${meta.title} — ${texts.comp.alt}`,
  );

  zip.file(
    "README.txt",
    `A+1 KDP Studio — Pacchetto completo\n\nContenuto:\n- immagini/: tutti i PNG dei moduli generati\n- testi/: tutti i testi associati ai moduli\n\nTitolo/Brand: ${meta.title}\nLingua marketplace: ${meta.lang}\nNicchia: ${meta.niche}\nTarget: ${meta.age}\n\nGenerato il: ${new Date().toLocaleString("it-IT")}\n`,
  );

  const safeTitle = meta.title.trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || "Aplus_KDP";
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}_Aplus_Pacchetto_Completo.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
