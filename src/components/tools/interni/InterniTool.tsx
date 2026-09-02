import {
  ArrowDown,
  ArrowUp,
  BookImage,
  Download,
  FilePlus2,
  FileUp,
  ImageDown,
  Loader2,
  Trash2,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";
import { useBookProject } from "@/hooks/useBookProject";
import { BookProjectPicker } from "@/components/tools/BookProjectPicker";

import {
  DEFAULT_FILLER_COLOR,
  DEFAULT_MARGINS,
  TRIM_SIZES,
  getTrimSize,
  suggestedKdpMargins,
} from "@/components/tools/interni/constants";
import {
  buildInteriorImagesZip,
  buildInteriorPdf,
  renderPreviewPages,
  renderSinglePagePreview,
} from "@/components/tools/interni/interiorPdf";
import { extractPdfPagesAsImages } from "@/components/tools/interni/pdfPageImport";
import {
  TEMPLATE_LIBRARY,
  getTemplateSpec,
  type TemplateId,
} from "@/components/tools/interni/templateLibrary";
import { TextOverlayEditor } from "@/components/tools/interni/TextOverlayEditor";
import {
  renderPageWithTextOverlayToFile,
  type TextOverlayState,
} from "@/components/tools/interni/textOverlay";
import type {
  FillMode,
  InteriorPage,
  PageMargins,
  PrintMode,
  TrimSizeId,
} from "@/components/tools/interni/types";

const TEMPLATE_CATEGORIES = [...new Set(TEMPLATE_LIBRARY.map((t) => t.category))];

// Il Sudoku è un vero puzzle generato e verificato al volo (non una pagina statica gratuita
// come righe/quadretti): a differenza degli altri template si acquista solo in pacchetti da 10
// pagine, ciascuno a 1 credito fisso — mai un numero libero di pagine.
const SUDOKU_TEMPLATE_ID: TemplateId = "sudoku-grid";
const SUDOKU_PAGES_PER_CREDIT = 10;
const MAX_SUDOKU_PER_BATCH = 100;
const SUDOKU_PACKAGE_SIZES = Array.from(
  { length: MAX_SUDOKU_PER_BATCH / SUDOKU_PAGES_PER_CREDIT },
  (_, i) => (i + 1) * SUDOKU_PAGES_PER_CREDIT,
); // [10, 20, 30, ..., 100]
const MAX_FREE_TEMPLATES_PER_BATCH = 200;
// operationId FISSO (non newOperationId()): consume_credit è idempotente per (utente,
// operationId), quindi il primo utilizzo addebita 1 credito e ogni tentativo successivo, in
// qualunque sessione/dispositivo, torna "duplicate" senza costo — è così che lo sblocco resta
// pagato una volta sola per sempre, invece che una volta a sessione.
const FREE_TEMPLATES_UNLOCK_OPERATION_ID = "interni-unlock-free-templates";
// La pagina bianca resta gratuita anche prima di sbloccare il resto della libreria: non ha
// alcun contenuto generato, è l'equivalente del pulsante "Inserisci pagina vuota" già gratuito.
const ALWAYS_FREE_TEMPLATE_IDS: ReadonlySet<TemplateId> = new Set(["blank-page"]);
// Stesso pattern di sblocco una tantum della libreria template, applicato a un piccolo "extra":
// la numerazione automatica delle pagine.
const PAGE_NUMBERING_UNLOCK_OPERATION_ID = "interni-unlock-page-numbering";

type ExportFormat = "pdf" | "png-zip" | "jpg-zip";
const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: "pdf", label: "PDF unico (pronto per la stampa KDP)" },
  { id: "png-zip", label: "Immagini PNG (una per pagina, in uno ZIP)" },
  { id: "jpg-zip", label: "Immagini JPG (una per pagina, in uno ZIP)" },
];

let pageUid = 0;
const nextPageId = () => `page-${Date.now().toString(36)}-${(pageUid += 1)}`;

/**
 * TOOL 5 — Interni.
 * Impaginatore per gli interni del libro: carica una raccolta di immagini, imposta formato
 * pagina KDP (trim size, margini asimmetrici, bleed) e modalità di stampa, poi ottieni un
 * unico PDF interno pronto per la stampa. 1 credito per ogni PDF generato con successo.
 */
export function InterniTool({ runtime }: { runtime: ToolRuntime }) {
  const bookProject = useBookProject();
  const [pages, setPages] = useState<InteriorPage[]>([]);
  const [trimSizeId, setTrimSizeId] = useState<TrimSizeId>("8.5x11");
  const [margins, setMargins] = useState<PageMargins>(DEFAULT_MARGINS);
  const [defaultFillMode, setDefaultFillMode] = useState<FillMode>("contain");
  const [printMode, setPrintMode] = useState<PrintMode>("continuous");
  const [fillerColor, setFillerColor] = useState(DEFAULT_FILLER_COLOR);
  const [leftHanded, setLeftHanded] = useState(false);
  const [useBleed, setUseBleed] = useState(false);
  const [pageNumbering, setPageNumbering] = useState(false);
  const [unlockingPageNumbering, setUnlockingPageNumbering] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(TEMPLATE_LIBRARY[0]!.id);
  const [templateCount, setTemplateCount] = useState(1);
  const [downloadingPageId, setDownloadingPageId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [generatedExport, setGeneratedExport] = useState<{
    blob: Blob;
    filename: string;
    format: ExportFormat;
  } | null>(null);
  const [importingPdf, setImportingPdf] = useState(false);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  const [previewPages, setPreviewPages] = useState<
    { dataUrl: string; isFiller: boolean; label: string }[]
  >([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [addingSudoku, setAddingSudoku] = useState(false);
  const [unlockingTemplates, setUnlockingTemplates] = useState(false);
  const [textEditorPageId, setTextEditorPageId] = useState<string | null>(null);
  const [applyingTextOverlay, setApplyingTextOverlay] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeGuard = useRef(false);
  const pageDownloadGuard = useRef(false);
  const sudokuAddGuard = useRef(false);
  const freeTemplateGuard = useRef(false);
  const textOverlayGuard = useRef(false);
  const pageNumberingGuard = useRef(false);

  const trim = getTrimSize(trimSizeId);

  function updateMargin(field: keyof PageMargins, value: number) {
    setMargins((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  }

  const docSpec = {
    trimWidthIn: trim.widthIn,
    trimHeightIn: trim.heightIn,
    margins,
    defaultFillMode,
    printMode,
    fillerColor,
    leftHanded,
    useBleed,
    pageNumbering,
  };

  // Anteprima scorrevole di TUTTE le pagine fisiche (inclusi i retro di riempimento), a bassa
  // risoluzione e con un piccolo debounce: si ricalcola ad ogni cambio di impostazione, anche
  // su documenti lunghi, senza bloccare la digitazione nei campi (es. margini).
  useEffect(() => {
    let cancelled = false;
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    if (pages.length === 0) {
      setPreviewPages([]);
      return;
    }
    previewDebounceRef.current = setTimeout(() => {
      setPreviewLoading(true);
      void renderPreviewPages(pages, docSpec)
        .then((rendered) => {
          if (cancelled) return;
          setPreviewPages(
            rendered.map((p) => ({
              dataUrl: p.canvas.toDataURL("image/png"),
              isFiller: p.isFiller,
              label: p.label,
            })),
          );
        })
        .finally(() => {
          if (!cancelled) setPreviewLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pages,
    trim.widthIn,
    trim.heightIn,
    margins,
    defaultFillMode,
    printMode,
    fillerColor,
    leftHanded,
    useBleed,
    pageNumbering,
  ]);

  // Il file già generato non corrisponde più alle impostazioni correnti: invalida il download
  // rapido (evita di far riscaricare un file non aggiornato senza che l'utente se ne accorga).
  useEffect(() => {
    setGeneratedExport(null);
  }, [
    pages,
    trim.widthIn,
    trim.heightIn,
    margins,
    defaultFillMode,
    printMode,
    fillerColor,
    leftHanded,
    useBleed,
    pageNumbering,
  ]);

  function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleAddFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const allFiles = Array.from(fileList);
    const validImages = allFiles.filter((f) => f.type.startsWith("image/"));
    const skipped = allFiles.length - validImages.length;
    if (validImages.length === 0) {
      toast.error("Nessuna immagine valida trovata nei file selezionati.");
      return;
    }
    if (skipped > 0) {
      toast.warning(
        `${skipped} file ${skipped === 1 ? "ignorato" : "ignorati"} perché non ${skipped === 1 ? "è un'immagine" : "sono immagini"}.`,
      );
    }
    const sorted = [...validImages].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    );
    setPages((prev) => [
      ...prev,
      ...sorted.map((file) => ({
        id: nextPageId(),
        kind: "image" as const,
        file,
        name: file.name,
        fillModeOverride: "default" as const,
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** Importa ogni pagina di un PDF già impaginato (es. un interno disegnato altrove) come
   * pagina-immagine, nello stesso ordine del documento sorgente. */
  async function handleImportPdf(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setImportingPdf(true);
    setImportProgress({ done: 0, total: 0 });
    try {
      const imported = await extractPdfPagesAsImages(file, (done, total) =>
        setImportProgress({ done, total }),
      );
      setPages((prev) => [
        ...prev,
        ...imported.map((f) => ({
          id: nextPageId(),
          kind: "image" as const,
          file: f,
          name: f.name,
          fillModeOverride: "default" as const,
        })),
      ]);
      toast.success(
        `${imported.length} ${imported.length === 1 ? "pagina importata" : "pagine importate"} dal PDF`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Importazione PDF non riuscita.");
    } finally {
      setImportingPdf(false);
      setImportProgress(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  function makeTemplatePage(templateId: TemplateId): InteriorPage {
    const spec = getTemplateSpec(templateId);
    return {
      id: nextPageId(),
      kind: "template",
      templateId,
      templateSeed: Math.floor(Math.random() * 2 ** 31),
      name: spec?.label ?? "Template",
      fillModeOverride: "default",
    };
  }

  /** Accoda `count` copie di un template sempre gratuito (es. la pagina bianca): nessun credito,
   * nessuno sblocco richiesto — utilizzabile fin da subito, anche prima di sbloccare il resto
   * della libreria. */
  function addAlwaysFreeTemplatePages(templateId: TemplateId, count: number) {
    const n = Math.max(1, Math.min(MAX_FREE_TEMPLATES_PER_BATCH, Math.round(count) || 1));
    setPages((prev) => [...prev, ...Array.from({ length: n }, () => makeTemplatePage(templateId))]);
  }

  /** Accoda `count` copie di un template gratuito (righe, quadretti, planner, registri...).
   * Il PRIMO utilizzo in assoluto della libreria (Sudoku e pagina bianca esclusi) costa 1 credito
   * una tantum:
   * addebitato con un operationId fisso, così ogni tentativo successivo — in questa o in
   * qualunque altra sessione — torna "duplicate" e non costa più nulla. Se il primo sblocco
   * fallisce per crediti insufficienti, nessuna pagina viene aggiunta. */
  async function addFreeTemplatePages(templateId: TemplateId, count: number) {
    if (freeTemplateGuard.current) return;
    freeTemplateGuard.current = true;
    try {
      const n = Math.max(1, Math.min(MAX_FREE_TEMPLATES_PER_BATCH, Math.round(count) || 1));
      setUnlockingTemplates(true);
      try {
        // Non si passa da runtime.ensureAccess()/canOperate qui: una volta sbloccata, la
        // libreria deve restare gratuita per l'utente anche se in seguito i crediti finiscono o
        // l'abbonamento cambia — l'unica autorità è la risposta di charge() sull'operationId fisso.
        const result = await runtime.charge(
          FREE_TEMPLATES_UNLOCK_OPERATION_ID,
          "Sblocco libreria template Interni",
        );
        if (!result.ok) {
          runtime.blockOperation();
          return;
        }
        setPages((prev) => [
          ...prev,
          ...Array.from({ length: n }, () => makeTemplatePage(templateId)),
        ]);
        if (!result.duplicate) {
          toast.success(
            "Libreria template sbloccata — 1 credito. Da ora in poi è sempre gratuita.",
          );
        }
      } finally {
        setUnlockingTemplates(false);
      }
    } finally {
      freeTemplateGuard.current = false;
    }
  }

  /** Genera `count` puzzle Sudoku (dalla UI: sempre un multiplo di 10, un pacchetto da
   * SUDOKU_PAGES_PER_CREDIT pagine = 1 credito fisso). Se i crediti finiscono a metà, si fermano
   * insieme l'addebito e l'aggiunta pagine, mantenendo solo i pacchetti effettivamente pagati. */
  async function addSudokuPages(count: number) {
    if (sudokuAddGuard.current) return;
    sudokuAddGuard.current = true;
    try {
      const n = Math.max(1, Math.min(MAX_SUDOKU_PER_BATCH, Math.round(count) || 1));
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setAddingSudoku(true);
      try {
        const newPages: InteriorPage[] = [];
        for (let addedSoFar = 0; addedSoFar < n; addedSoFar += SUDOKU_PAGES_PER_CREDIT) {
          const result = await runtime.charge(
            newOperationId("interni-sudoku-batch"),
            `Fino a ${SUDOKU_PAGES_PER_CREDIT} puzzle Sudoku generati`,
          );
          if (!result.ok) break;
          const batchSize = Math.min(SUDOKU_PAGES_PER_CREDIT, n - addedSoFar);
          for (let i = 0; i < batchSize; i++) {
            newPages.push(makeTemplatePage(SUDOKU_TEMPLATE_ID));
          }
        }

        if (newPages.length > 0) {
          setPages((prev) => [...prev, ...newPages]);
        }

        const creditsSpent = Math.ceil(newPages.length / SUDOKU_PAGES_PER_CREDIT);
        if (newPages.length === n) {
          toast.success(
            `${newPages.length} ${newPages.length === 1 ? "puzzle Sudoku aggiunto" : "puzzle Sudoku aggiunti"} — ${creditsSpent} ${creditsSpent === 1 ? "credito" : "crediti"}`,
          );
        } else if (newPages.length > 0) {
          toast.warning(
            `Aggiunti solo ${newPages.length} di ${n} puzzle Sudoku (${creditsSpent} ${creditsSpent === 1 ? "credito" : "crediti"}): crediti esauriti a metà dell'operazione.`,
          );
        } else {
          toast.error("Nessun puzzle Sudoku aggiunto: crediti non disponibili.");
        }
      } finally {
        setAddingSudoku(false);
      }
    } finally {
      sudokuAddGuard.current = false;
    }
  }

  function handleAddTemplateClick() {
    if (selectedTemplateId === SUDOKU_TEMPLATE_ID) {
      void addSudokuPages(templateCount);
    } else if (ALWAYS_FREE_TEMPLATE_IDS.has(selectedTemplateId)) {
      addAlwaysFreeTemplatePages(selectedTemplateId, templateCount);
    } else {
      void addFreeTemplatePages(selectedTemplateId, templateCount);
    }
  }

  /** Attiva/disattiva la numerazione automatica delle pagine. Attivarla la prima volta costa 1
   * credito una tantum (stesso operationId fisso della libreria template): da lì in poi resta
   * disponibile per sempre, anche disattivandola e riattivandola. Disattivarla è sempre gratis. */
  async function handleTogglePageNumbering(next: boolean) {
    if (!next) {
      setPageNumbering(false);
      return;
    }
    if (pageNumberingGuard.current) return;
    pageNumberingGuard.current = true;
    try {
      setUnlockingPageNumbering(true);
      try {
        const result = await runtime.charge(
          PAGE_NUMBERING_UNLOCK_OPERATION_ID,
          "Sblocco numerazione pagine Interni",
        );
        if (!result.ok) {
          runtime.blockOperation();
          return;
        }
        setPageNumbering(true);
        if (!result.duplicate) {
          toast.success(
            "Numerazione pagine sbloccata — 1 credito. Da ora in poi è sempre disponibile.",
          );
        }
      } finally {
        setUnlockingPageNumbering(false);
      }
    } finally {
      pageNumberingGuard.current = false;
    }
  }

  /** Scarica una singola pagina come PNG. Azione a parte dal PDF completo: costa 1 credito. */
  async function handleDownloadPageImage(page: InteriorPage) {
    if (pageDownloadGuard.current) return;
    pageDownloadGuard.current = true;
    try {
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setDownloadingPageId(page.id);
      try {
        const canvas = await renderSinglePagePreview(page, docSpec);

        // Credito confermato prima di consegnare il file: nessun download se il charge fallisce.
        const result = await runtime.charge(
          newOperationId("interni-page-download"),
          "Download immagine pagina",
        );
        if (!result.ok) return;

        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `${page.name || "pagina"}_${trim.id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(result.duplicate ? "Immagine scaricata" : "Immagine scaricata — 1 credito");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Download immagine non riuscito.");
      } finally {
        setDownloadingPageId(null);
      }
    } finally {
      pageDownloadGuard.current = false;
    }
  }

  /** Applica il testo scritto nel piccolo editor canvas alla pagina: la "cuoce" in un'immagine
   * a risoluzione di stampa e la pagina diventa da quel momento una normale pagina-immagine.
   * Costa 1 credito, addebitato solo dopo aver renderizzato il file (nulla cambia se il credito
   * non è disponibile). */
  async function handleApplyTextOverlay(pageId: string, overlay: TextOverlayState) {
    if (textOverlayGuard.current) return;
    textOverlayGuard.current = true;
    try {
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setApplyingTextOverlay(true);
      try {
        const file = await renderPageWithTextOverlayToFile(
          page,
          trim.widthIn,
          trim.heightIn,
          overlay,
          leftHanded,
        );

        const result = await runtime.charge(
          newOperationId("interni-text-overlay"),
          "Testo aggiunto alla pagina",
        );
        if (!result.ok) return;

        setPages((prev) =>
          prev.map((p) =>
            p.id === pageId
              ? {
                  id: p.id,
                  kind: "image",
                  file,
                  name: "Pagina con testo",
                  fillModeOverride: p.fillModeOverride,
                }
              : p,
          ),
        );
        setTextEditorPageId(null);
        toast.success(result.duplicate ? "Testo applicato" : "Testo applicato — 1 credito");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Applicazione del testo non riuscita.",
        );
      } finally {
        setApplyingTextOverlay(false);
      }
    } finally {
      textOverlayGuard.current = false;
    }
  }

  function insertBlankPageAfter(index: number) {
    setPages((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, { id: nextPageId(), kind: "blank", fillModeOverride: "default" });
      return next;
    });
  }

  function removePage(id: string) {
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  function movePage(index: number, direction: -1 | 1) {
    setPages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved!);
      return next;
    });
  }

  function updatePageFillMode(id: string, value: FillMode | "default") {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, fillModeOverride: value } : p)));
  }

  async function handleGenerate() {
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
      if (pages.length === 0) {
        toast.error("Carica almeno un'immagine prima di generare l'interno.");
        return;
      }
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setGenerating(true);
      const operationId = newOperationId("interni-pdf");
      try {
        const isPdf = exportFormat === "pdf";
        const blob = isPdf
          ? await buildInteriorPdf(pages, docSpec)
          : await buildInteriorImagesZip(
              pages,
              docSpec,
              exportFormat === "png-zip" ? "png" : "jpg",
            );
        const filename = isPdf
          ? `Interno_KDP_${trim.id}_${Date.now()}.pdf`
          : `Interno_KDP_${trim.id}_${Date.now()}.zip`;

        // Il credito viene confermato PRIMA di consegnare il file: se il charge fallisse
        // (limite raggiunto, abbonamento non attivo, ecc.) nessun download deve partire.
        const result = await runtime.charge(operationId, "Interno generato");
        if (!result.ok) return;

        triggerBlobDownload(blob, filename);
        // Tenuto in stato: permette di riscaricarlo in seguito (es. se il download automatico
        // viene bloccato dal browser) senza rigenerare il file e senza consumare un altro credito.
        setGeneratedExport({ blob, filename, format: exportFormat });
        toast.success(result.duplicate ? "Interno generato" : "Interno generato — 1 credito");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Generazione non riuscita.");
      } finally {
        setGenerating(false);
      }
    } finally {
      chargeGuard.current = false;
    }
  }

  const textEditorPage = textEditorPageId
    ? (pages.find((p) => p.id === textEditorPageId) ?? null)
    : null;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="panel space-y-5 p-6">
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Impaginazione interni KDP
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Carica le immagini nell'ordine in cui devono comparire, imposta formato e margini, poi
              genera il PDF interno completo.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interni-trim-size">Formato pagina (Trim Size)</Label>
            <Select value={trimSizeId} onValueChange={(v) => setTrimSizeId(v as TrimSizeId)}>
              <SelectTrigger id="interni-trim-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Standard", "Grande"] as const).map((category) => (
                  <div key={category}>
                    <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {category === "Standard" ? "Standard" : "Grande (costo di stampa maggiore)"}
                    </p>
                    {TRIM_SIZES.filter((t) => t.category === category).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Tutti i 16 formati brossura ufficiali KDP. "Grande" (oltre 6.12"×9") costa di più per
              pagina in stampa, quindi riduce la royalty a parità di prezzo di copertina.
            </p>
          </div>

          {/* Margini asimmetrici */}
          <div className="space-y-2 rounded-md border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                Margini (pollici) — per modalità "con margine"
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px]"
                onClick={() => setMargins(suggestedKdpMargins(Math.max(1, pages.length), useBleed))}
              >
                Applica margini consigliati KDP
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="m-top" className="text-[11px]">
                  Alto
                </Label>
                <Input
                  id="m-top"
                  type="number"
                  min={0}
                  step={0.01}
                  value={margins.topIn}
                  onChange={(e) => updateMargin("topIn", Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-bottom" className="text-[11px]">
                  Basso
                </Label>
                <Input
                  id="m-bottom"
                  type="number"
                  min={0}
                  step={0.01}
                  value={margins.bottomIn}
                  onChange={(e) => updateMargin("bottomIn", Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-inside" className="text-[11px]">
                  Interno (dorso)
                </Label>
                <Input
                  id="m-inside"
                  type="number"
                  min={0}
                  step={0.01}
                  value={margins.insideIn}
                  onChange={(e) => updateMargin("insideIn", Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-outside" className="text-[11px]">
                  Esterno
                </Label>
                <Input
                  id="m-outside"
                  type="number"
                  min={0}
                  step={0.01}
                  value={margins.outsideIn}
                  onChange={(e) => updateMargin("outsideIn", Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              "Interno" è il lato verso il dorso/rilegatura e viene specchiato automaticamente tra
              pagine destre e sinistre; KDP richiede un margine interno minimo crescente con il
              numero di pagine del libro (più spesso = dorso più "ingombrante"). Nessun limite fisso
              qui: "Applica margini consigliati KDP" li imposta in base al numero di pagine attuali,
              ma restano sempre modificabili a mano — l'anteprima si aggiorna subito.
            </p>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
            <div className="space-y-0.5">
              <Label htmlFor="interni-bleed" className="text-sm">
                Abbondanza (bleed)
              </Label>
              <p className="text-xs text-muted-foreground">
                Aggiunge 0.125" di margine oltre il bordo di taglio su ogni lato, come richiesto da
                KDP quando il contenuto arriva fino al bordo pagina. Scelta indipendente dallo stile
                delle singole pagine: se disattiva, il documento resta esattamente al formato di
                trim scelto.
              </p>
            </div>
            <Switch id="interni-bleed" checked={useBleed} onCheckedChange={setUseBleed} />
          </div>

          <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
            <div className="space-y-0.5">
              <Label htmlFor="interni-left-handed" className="text-sm">
                Layout per mancini
              </Label>
              <p className="text-xs text-muted-foreground">
                Specchia il margine di rilegatura e gli elementi asimmetrici dei template (il
                margine rosso delle righe, la colonna spunti del metodo Cornell) sul lato opposto —
                utile per chi scrive con la mano sinistra.
              </p>
            </div>
            <Switch id="interni-left-handed" checked={leftHanded} onCheckedChange={setLeftHanded} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interni-default-fill">Stile pagina di default</Label>
            <Select
              value={defaultFillMode}
              onValueChange={(v) => setDefaultFillMode(v as FillMode)}
            >
              <SelectTrigger id="interni-default-fill">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">
                  Con margine (ridimensionamento automatico, nessun ritaglio)
                </SelectItem>
                <SelectItem value="cover">
                  Piena pagina (riempie il bordo, ritaglia l'eccesso)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Puoi comunque scegliere uno stile diverso per ogni singola pagina qui sotto.
              L&apos;abbondanza (bleed) è un&apos;impostazione a parte, più sotto.
            </p>
          </div>

          {/* Modalità di stampa */}
          <div className="space-y-2 rounded-md border border-border bg-surface p-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">
              Modalità di stampa
            </Label>
            <Select value={printMode} onValueChange={(v) => setPrintMode(v as PrintMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continuous">Immagine continua, senza interruzioni</SelectItem>
                <SelectItem value="singleSidedWithFiller">
                  Solo fronte, retro di riempimento (bianco o colore)
                </SelectItem>
              </SelectContent>
            </Select>
            {printMode === "singleSidedWithFiller" ? (
              <>
                <p className="text-[11px] text-muted-foreground">
                  Dopo ogni immagine viene inserita automaticamente una pagina di riempimento, per
                  ottenere una stampa di fatto solo fronte (utile per evitare che
                  pennarelli/pastelli passino sul disegno successivo).
                </p>
                <div className="flex items-center gap-2">
                  <Label htmlFor="filler-color" className="text-[11px]">
                    Colore riempimento
                  </Label>
                  <Input
                    id="filler-color"
                    type="color"
                    value={fillerColor}
                    onChange={(e) => setFillerColor(e.target.value)}
                    className="h-8 w-16 p-1"
                  />
                  <span className="text-[11px] text-muted-foreground">{fillerColor}</span>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Le pagine si susseguono nell'ordine dell'elenco, senza pagine aggiuntive.
              </p>
            )}
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <Label htmlFor="interni-files" className="sr-only">
              Carica immagini
            </Label>
            <input
              id="interni-files"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAddFiles(e.target.files)}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground"
            />
            <p className="text-[11px] text-muted-foreground">
              Puoi ripetere la selezione per aggiungere altre immagini: verranno accodate in ordine
              alfabetico/numerico.
            </p>
          </div>

          {/* Importa da PDF esistente */}
          <div className="space-y-2">
            <Label
              htmlFor="interni-pdf-file"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground hover:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
            >
              {importingPdf ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : (
                <FileUp className="size-4 shrink-0" />
              )}
              <span>
                {importingPdf
                  ? importProgress && importProgress.total > 0
                    ? `Importazione pagina ${importProgress.done} di ${importProgress.total}...`
                    : "Analisi del PDF in corso..."
                  : "Oppure importa le pagine da un PDF già impaginato"}
              </span>
              <input
                id="interni-pdf-file"
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                disabled={importingPdf}
                onChange={(e) => void handleImportPdf(e.target.files)}
                className="sr-only"
              />
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Ogni pagina del PDF diventa una pagina-immagine qui sotto, nello stesso ordine del
              documento: utile per riprendere un interno già pronto (o disegnato in un altro
              programma) e reimpaginarlo con formato, margini e stampa di Interni.
            </p>
          </div>

          {/* Libreria interni a basso contenuto */}
          <div className="space-y-2 rounded-md border border-border bg-surface p-3">
            <Label className="flex items-center gap-2 text-xs tracking-wide uppercase text-muted-foreground">
              <BookImage className="size-3.5" />
              Libreria interni a basso contenuto
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Pagine pronte (quaderni, planner, attività) generate al momento: nessuna immagine
              esterna, si adattano automaticamente al formato scelto.
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={selectedTemplateId}
                onValueChange={(v) => {
                  const next = v as TemplateId;
                  setSelectedTemplateId(next);
                  if (next === SUDOKU_TEMPLATE_ID) {
                    // Il Sudoku si sceglie solo in pacchetti da 10: si riparte sempre dal più
                    // piccolo, non si eredita un numero libero impostato per un altro template.
                    setTemplateCount(SUDOKU_PAGES_PER_CREDIT);
                  }
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <div key={category}>
                      <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </p>
                      {TEMPLATE_LIBRARY.filter((t) => t.category === category).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateId === SUDOKU_TEMPLATE_ID ? (
                <Select
                  value={String(templateCount)}
                  onValueChange={(v) => setTemplateCount(Number(v))}
                >
                  <SelectTrigger className="w-44 shrink-0" aria-label="Pacchetto Sudoku">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUDOKU_PACKAGE_SIZES.map((size) => {
                      const credits = size / SUDOKU_PAGES_PER_CREDIT;
                      return (
                        <SelectItem key={size} value={String(size)}>
                          {size} pagine ({credits} {credits === 1 ? "credito" : "crediti"})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min={1}
                  max={MAX_FREE_TEMPLATES_PER_BATCH}
                  value={templateCount}
                  onChange={(e) =>
                    setTemplateCount(
                      Math.max(
                        1,
                        Math.min(MAX_FREE_TEMPLATES_PER_BATCH, Number(e.target.value) || 1),
                      ),
                    )
                  }
                  className="w-16 shrink-0 text-center"
                  aria-label="Quante copie aggiungere"
                  title="Quante copie aggiungere"
                />
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTemplateClick}
                disabled={
                  selectedTemplateId === SUDOKU_TEMPLATE_ID
                    ? addingSudoku || runtime.charging
                    : !ALWAYS_FREE_TEMPLATE_IDS.has(selectedTemplateId) &&
                      (unlockingTemplates || runtime.charging)
                }
              >
                {(
                  selectedTemplateId === SUDOKU_TEMPLATE_ID
                    ? addingSudoku || runtime.charging
                    : !ALWAYS_FREE_TEMPLATE_IDS.has(selectedTemplateId) &&
                      (unlockingTemplates || runtime.charging)
                ) ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <FilePlus2 className="mr-1.5 size-3.5" />
                )}
                {selectedTemplateId === SUDOKU_TEMPLATE_ID
                  ? (() => {
                      const credits = Math.ceil(templateCount / SUDOKU_PAGES_PER_CREDIT);
                      return `Aggiungi (${credits} ${credits === 1 ? "credito" : "crediti"})`;
                    })()
                  : "Aggiungi"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {selectedTemplateId === SUDOKU_TEMPLATE_ID
                ? `Ogni pagina Sudoku è un puzzle vero generato al momento (soluzione unica garantita). Si acquista in pacchetti da ${SUDOKU_PAGES_PER_CREDIT} pagine, sempre 1 credito a pacchetto: fino a ${MAX_SUDOKU_PER_BATCH} alla volta.`
                : ALWAYS_FREE_TEMPLATE_IDS.has(selectedTemplateId)
                  ? "Pagina completamente bianca: sempre gratuita, nessun credito richiesto — utilizzabile anche prima di sbloccare il resto della libreria."
                  : "Imposta un numero maggiore di 1 per accodare più copie dello stesso template in un solo click (es. 20 pagine di righe strette). Il primo utilizzo della libreria (Sudoku e pagina bianca esclusi) costa 1 credito una tantum, poi resta sempre gratuita."}
            </p>
          </div>

          {/* Elenco pagine */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                Pagine ({pages.length})
              </Label>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {pages.length === 0 && (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Nessuna pagina caricata.
                </p>
              )}
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface p-2 text-xs"
                >
                  <span className="w-6 shrink-0 text-center font-mono text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {page.kind === "blank" ? "— Pagina vuota —" : page.name}
                  </span>
                  <Select
                    value={page.fillModeOverride}
                    onValueChange={(v) => updatePageFillMode(page.id, v as FillMode | "default")}
                  >
                    <SelectTrigger className="h-8 w-[150px] shrink-0 text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default documento</SelectItem>
                      <SelectItem value="contain">Con margine</SelectItem>
                      <SelectItem value="cover">Piena pagina</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      disabled={index === 0}
                      onClick={() => movePage(index, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      disabled={index === pages.length - 1}
                      onClick={() => movePage(index, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      onClick={() => insertBlankPageAfter(index)}
                      title="Inserisci pagina vuota dopo"
                    >
                      <FilePlus2 className="size-3.5" />
                    </Button>
                    {(page.kind === "blank" ||
                      (page.kind === "template" && page.templateId !== SUDOKU_TEMPLATE_ID)) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => setTextEditorPageId(page.id)}
                        title="Scrivi sulla pagina (1 credito)"
                      >
                        <Type className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      disabled={downloadingPageId === page.id}
                      onClick={() => handleDownloadPageImage(page)}
                      title="Scarica questa pagina come PNG (1 credito)"
                    >
                      {downloadingPageId === page.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ImageDown className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removePage(page.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
            <div className="space-y-0.5">
              <Label htmlFor="interni-page-numbering" className="text-sm">
                Numerazione pagine automatica
              </Label>
              <p className="text-xs text-muted-foreground">
                Extra opzionale: numera ogni pagina in basso, verso il bordo esterno. Si sblocca una
                tantum per 1 credito — una volta attivata la prima volta resta disponibile per
                sempre, anche spegnendola e riaccendendola.
              </p>
            </div>
            <Switch
              id="interni-page-numbering"
              checked={pageNumbering}
              disabled={unlockingPageNumbering || runtime.charging}
              onCheckedChange={(v) => void handleTogglePageNumbering(v)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interni-export-format">Formato di esportazione</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger id="interni-export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Il PDF unico è il formato richiesto da KDP per la stampa; le immagini PNG/JPG sono
              utili per riusare le pagine altrove.
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || runtime.charging}
            className="w-full"
          >
            {generating || runtime.charging ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            {exportFormat === "pdf" ? "Genera PDF interno" : "Genera ZIP immagini"} (1 credito)
          </Button>

          {generatedExport && (
            <div className="space-y-2 rounded-md border border-border bg-surface p-3">
              <p className="text-xs text-muted-foreground">
                File generato. Se il download automatico non è partito (o l'hai chiuso per sbaglio),
                puoi riscaricarlo qui — non consuma un altro credito.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => triggerBlobDownload(generatedExport.blob, generatedExport.filename)}
              >
                <Download className="mr-2 size-4" /> Scarica di nuovo
              </Button>
            </div>
          )}

          {generatedExport && generatedExport.format === "pdf" && (
            <div className="space-y-1.5">
              <Label>Salva come interno di un progetto libro (opzionale)</Label>
              <p className="text-xs text-muted-foreground">
                Rende questo PDF disponibile agli altri tool (Pubblicazione, A+, Blurb, Bio, Promo)
                senza doverlo ricaricare.
              </p>
              <BookProjectPicker
                bookProject={bookProject}
                currentCoverFile={null}
                currentInteriorFile={
                  new File([generatedExport.blob], generatedExport.filename, {
                    type: "application/pdf",
                  })
                }
                onFilesLoaded={() => {
                  // Qui il picker serve solo a scegliere/creare il progetto di destinazione:
                  // gli eventuali file già presenti nel progetto selezionato non servono a Interni.
                }}
              />
            </div>
          )}
        </div>

        <div className="panel flex max-h-[calc(100vh-8rem)] flex-col space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Anteprima completa ({previewPages.length}{" "}
              {previewPages.length === 1 ? "pagina" : "pagine"})
            </h3>
            {previewLoading && (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {trim.label} · interno {margins.insideIn}" / esterno {margins.outsideIn}" · alto{" "}
            {margins.topIn}" / basso {margins.bottomIn}" ·{" "}
            {defaultFillMode === "cover" ? "piena pagina" : "con margine"} ·{" "}
            {printMode === "singleSidedWithFiller" ? "solo fronte + riempimento" : "continua"} ·{" "}
            {useBleed ? "con abbondanza" : "senza abbondanza"}
          </p>
          {previewPages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-md border border-border bg-black/60 p-3">
              <p className="p-10 text-center text-xs text-muted-foreground">
                Carica almeno un&apos;immagine per vedere l&apos;anteprima.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-border bg-black/60 p-3">
              {previewPages.map((p, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-white/70">{p.label}</span>
                    {p.isFiller && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                        Pagina di riempimento
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center overflow-hidden rounded-md bg-white">
                    <img
                      src={p.dataUrl}
                      alt={p.label}
                      className="h-auto max-h-[420px] w-full max-w-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {textEditorPage && (
        <TextOverlayEditor
          open
          onOpenChange={(next) => {
            if (!next) setTextEditorPageId(null);
          }}
          page={textEditorPage}
          trimWidthIn={trim.widthIn}
          trimHeightIn={trim.heightIn}
          mirrored={leftHanded}
          applying={applyingTextOverlay}
          onApply={(overlay) => void handleApplyTextOverlay(textEditorPage.id, overlay)}
        />
      )}
    </>
  );
}
