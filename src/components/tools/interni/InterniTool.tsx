import { ArrowDown, ArrowUp, BookImage, Download, FilePlus2, ImageDown, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";

import { DEFAULT_FILLER_COLOR, DEFAULT_MARGINS, TRIM_SIZES, getTrimSize } from "@/components/tools/interni/constants";
import { buildInteriorPdf, renderFirstPagePreview, renderSinglePagePreview } from "@/components/tools/interni/interiorPdf";
import { TEMPLATE_LIBRARY, getTemplateSpec, type TemplateId } from "@/components/tools/interni/templateLibrary";
import type { FillMode, InteriorPage, PageMargins, PrintMode, TrimSizeId } from "@/components/tools/interni/types";

const TEMPLATE_CATEGORIES = [...new Set(TEMPLATE_LIBRARY.map((t) => t.category))];

let pageUid = 0;
const nextPageId = () => `page-${Date.now().toString(36)}-${(pageUid += 1)}`;

/**
 * TOOL 5 — Interni.
 * Impaginatore per gli interni del libro: carica una raccolta di immagini, imposta formato
 * pagina KDP (trim size, margini asimmetrici, bleed) e modalità di stampa, poi ottieni un
 * unico PDF interno pronto per la stampa. 1 credito per ogni PDF generato con successo.
 */
export function InterniTool({ runtime }: { runtime: ToolRuntime }) {
  const [pages, setPages] = useState<InteriorPage[]>([]);
  const [trimSizeId, setTrimSizeId] = useState<TrimSizeId>("8.5x11");
  const [margins, setMargins] = useState<PageMargins>(DEFAULT_MARGINS);
  const [defaultFillMode, setDefaultFillMode] = useState<FillMode>("contain");
  const [printMode, setPrintMode] = useState<PrintMode>("continuous");
  const [fillerColor, setFillerColor] = useState(DEFAULT_FILLER_COLOR);
  const [generating, setGenerating] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>(TEMPLATE_LIBRARY[0]!.id);
  const [downloadingPageId, setDownloadingPageId] = useState<string | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState<{ blob: Blob; filename: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chargeGuard = useRef(false);
  const pageDownloadGuard = useRef(false);

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
  };

  // Anteprima live della prima pagina fisica, aggiornata a ogni cambio di impostazione.
  useEffect(() => {
    const canvasEl = previewCanvasRef.current;
    if (!canvasEl || pages.length === 0) return;
    let cancelled = false;
    void renderFirstPagePreview(pages, docSpec).then((rendered) => {
      if (cancelled || !rendered) return;
      canvasEl.width = rendered.width;
      canvasEl.height = rendered.height;
      const ctx = canvasEl.getContext("2d");
      ctx?.drawImage(rendered, 0, 0);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, trim.widthIn, trim.heightIn, margins, defaultFillMode, printMode, fillerColor]);

  // Il PDF già generato non corrisponde più alle impostazioni correnti: invalida il download rapido
  // (evita di far riscaricare un file non aggiornato senza che l'utente se ne accorga).
  useEffect(() => {
    setGeneratedPdf(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, trim.widthIn, trim.heightIn, margins, defaultFillMode, printMode, fillerColor]);

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
    const validImages = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (validImages.length === 0) {
      toast.error("Nessuna immagine valida trovata nei file selezionati.");
      return;
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

  function addTemplatePage() {
    const spec = getTemplateSpec(selectedTemplateId);
    setPages((prev) => [
      ...prev,
      { id: nextPageId(), kind: "template", templateId: selectedTemplateId, name: spec?.label ?? "Template", fillModeOverride: "default" },
    ]);
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
        const result = await runtime.charge(newOperationId("interni-page-download"), "Download immagine pagina");
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
        toast.error("Carica almeno un'immagine prima di generare il PDF interno.");
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
        const blob = await buildInteriorPdf(pages, docSpec);
        const filename = `Interno_KDP_${trim.id}_${Date.now()}.pdf`;

        // Il credito viene confermato PRIMA di consegnare il file: se il charge fallisse
        // (limite raggiunto, abbonamento non attivo, ecc.) nessun download deve partire.
        const result = await runtime.charge(operationId, "PDF interno generato");
        if (!result.ok) return;

        triggerBlobDownload(blob, filename);
        // Tenuto in stato: permette di riscaricarlo in seguito (es. se il download automatico
        // viene bloccato dal browser) senza rigenerare il PDF e senza consumare un altro credito.
        setGeneratedPdf({ blob, filename });
        toast.success(result.duplicate ? "PDF generato" : "PDF generato — 1 credito");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Generazione PDF non riuscita.");
      } finally {
        setGenerating(false);
      }
    } finally {
      chargeGuard.current = false;
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="panel space-y-5 p-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Impaginazione interni KDP
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Carica le immagini nell'ordine in cui devono comparire, imposta formato e margini, poi genera il PDF
            interno completo.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Formato pagina (Trim Size)</Label>
          <Select value={trimSizeId} onValueChange={(v) => setTrimSizeId(v as TrimSizeId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIM_SIZES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Margini asimmetrici */}
        <div className="space-y-2 rounded-md border border-border bg-surface p-3">
          <Label className="text-xs tracking-wide uppercase text-muted-foreground">
            Margini (pollici) — per modalità "con margine"
          </Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="m-top" className="text-[11px]">Alto</Label>
              <Input
                id="m-top"
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={margins.topIn}
                onChange={(e) => updateMargin("topIn", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-bottom" className="text-[11px]">Basso</Label>
              <Input
                id="m-bottom"
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={margins.bottomIn}
                onChange={(e) => updateMargin("bottomIn", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-inside" className="text-[11px]">Interno (dorso)</Label>
              <Input
                id="m-inside"
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={margins.insideIn}
                onChange={(e) => updateMargin("insideIn", Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="m-outside" className="text-[11px]">Esterno</Label>
              <Input
                id="m-outside"
                type="number"
                min={0}
                max={2}
                step={0.05}
                value={margins.outsideIn}
                onChange={(e) => updateMargin("outsideIn", Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            "Interno" è il lato verso il dorso/rilegatura e viene specchiato automaticamente tra pagine destre e
            sinistre; di solito conviene tenerlo leggermente più ampio di "Esterno".
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Stile pagina di default</Label>
          <Select value={defaultFillMode} onValueChange={(v) => setDefaultFillMode(v as FillMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contain">Con margine (ridimensionamento automatico, nessun ritaglio)</SelectItem>
              <SelectItem value="cover">Piena pagina (con abbondanza/bleed, ritaglia l'eccesso)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Puoi comunque scegliere uno stile diverso per ogni singola pagina qui sotto.
          </p>
        </div>

        {/* Modalità di stampa */}
        <div className="space-y-2 rounded-md border border-border bg-surface p-3">
          <Label className="text-xs tracking-wide uppercase text-muted-foreground">Modalità di stampa</Label>
          <Select value={printMode} onValueChange={(v) => setPrintMode(v as PrintMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="continuous">Immagine continua, senza interruzioni</SelectItem>
              <SelectItem value="singleSidedWithFiller">Solo fronte, retro di riempimento (bianco o colore)</SelectItem>
            </SelectContent>
          </Select>
          {printMode === "singleSidedWithFiller" ? (
            <>
              <p className="text-[11px] text-muted-foreground">
                Dopo ogni immagine viene inserita automaticamente una pagina di riempimento, per ottenere una
                stampa di fatto solo fronte (utile per evitare che pennarelli/pastelli passino sul disegno
                successivo).
              </p>
              <div className="flex items-center gap-2">
                <Label htmlFor="filler-color" className="text-[11px]">Colore riempimento</Label>
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
            Puoi ripetere la selezione per aggiungere altre immagini: verranno accodate in ordine alfabetico/numerico.
          </p>
        </div>

        {/* Libreria interni a basso contenuto */}
        <div className="space-y-2 rounded-md border border-border bg-surface p-3">
          <Label className="flex items-center gap-2 text-xs tracking-wide uppercase text-muted-foreground">
            <BookImage className="size-3.5" />
            Libreria interni a basso contenuto
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Pagine pronte (quaderni, planner, attività) generate al momento: nessuna immagine esterna, si adattano
            automaticamente al formato scelto.
          </p>
          <div className="flex items-center gap-2">
            <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v as TemplateId)}>
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
            <Button type="button" variant="outline" onClick={addTemplatePage}>
              <FilePlus2 className="mr-1.5 size-3.5" /> Aggiungi
            </Button>
          </div>
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
                <span className="w-6 shrink-0 text-center font-mono text-muted-foreground">{index + 1}</span>
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
                  <Button variant="ghost" size="sm" className="size-7 p-0" disabled={index === 0} onClick={() => movePage(index, -1)}>
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
                  <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => insertBlankPageAfter(index)} title="Inserisci pagina vuota dopo">
                    <FilePlus2 className="size-3.5" />
                  </Button>
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

        <Button onClick={handleGenerate} disabled={generating || runtime.charging} className="w-full">
          {generating || runtime.charging ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Genera PDF interno (1 credito)
        </Button>

        {generatedPdf && (
          <div className="space-y-2 rounded-md border border-border bg-surface p-3">
            <p className="text-xs text-muted-foreground">
              PDF generato. Se il download automatico non è partito (o l'hai chiuso per sbaglio), puoi
              riscaricarlo qui — non consuma un altro credito.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => triggerBlobDownload(generatedPdf.blob, generatedPdf.filename)}
            >
              <Download className="mr-2 size-4" /> Scarica di nuovo il PDF generato
            </Button>
          </div>
        )}
      </div>

      <div className="panel space-y-3 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Anteprima pagina 1
        </h3>
        <p className="text-xs text-muted-foreground">
          {trim.label} · interno {margins.insideIn}" / esterno {margins.outsideIn}" ·{" "}
          {defaultFillMode === "cover" ? "piena pagina" : "con margine"} ·{" "}
          {printMode === "singleSidedWithFiller" ? "solo fronte + riempimento" : "continua"}
        </p>
        <div className="flex items-center justify-center overflow-hidden rounded-md border border-border bg-black/60 p-3">
          {pages.length > 0 ? (
            <canvas ref={previewCanvasRef} className="h-auto max-h-[520px] w-full max-w-full object-contain" />
          ) : (
            <p className="p-10 text-center text-xs text-muted-foreground">
              Carica almeno un'immagine per vedere l'anteprima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
