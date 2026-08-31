import { ArrowLeft, ArrowRight, ArrowDown, Download, Loader2, Redo2, Sparkles, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";

import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { imageFileToJpeg } from "@/components/tools/pdfContent";
import { analyzeTriageImage } from "@/lib/aiCopy.functions";

import { buildTriageZip, type TriageResult, type TriageZipLocale } from "./triageZip";

/**
 * TOOL 4 — Triage foto (modulo indipendente).
 * Porting fedele dell'app HTML "KDP Image Quick Triage Hub - Pro Edition":
 * coda di caricamento multipla, revisione manuale immagine per immagine
 * (Bocciata / Rimandata / Promossa) con scorciatoie da tastiera e undo,
 * e infine esportazione ZIP con le Promosse suddivise in cartelle "Libro_N"
 * da N pagine (soglia configurabile) + eventuale "Libro_x" per il resto.
 * La revisione è gratuita: il credito viene scalato solo al download completato.
 */

type Phase = "upload" | "triage" | "export";
type Category = "promossa" | "rimandata" | "bocciata";

interface HistoryEntry {
  index: number;
  category: Category;
  file: File;
}

const CATEGORY_LABEL: Record<Category, string> = {
  promossa: "Promossa",
  rimandata: "Rimandata",
  bocciata: "Bocciata",
};

export function TriageTool({ runtime }: { runtime: ToolRuntime }) {
  const outputLocale = useOutputLanguage() as TriageZipLocale;
  const [phase, setPhase] = useState<Phase>("upload");
  const [queue, setQueue] = useState<File[]>([]);
  const [batchSize, setBatchSize] = useState(40);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const [orderedFiles, setOrderedFiles] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [promosse, setPromosse] = useState<File[]>([]);
  const [rimandate, setRimandate] = useState<File[]>([]);
  const [bocciate, setBocciate] = useState<File[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState<{ category: Category; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentFile = orderedFiles[currentIndex] ?? null;

  // Genera/rilascia l'anteprima dell'immagine corrente.
  useEffect(() => {
    if (phase !== "triage" || !currentFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(currentFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [phase, currentFile]);

  // Il suggerimento AI vale solo per l'immagine corrente: si azzera cambiando immagine.
  useEffect(() => {
    setAiSuggestion(null);
  }, [currentIndex, phase]);

  /**
   * Suggerimento AI opzionale sulla singola immagine corrente (on-demand, mai automatico
   * su tutta la coda: rispetta i limiti di free tier ed evita costi non richiesti).
   * Non consuma credito e non decide al posto dell'operatore: la scelta finale resta manuale.
   */
  async function handleAskAi() {
    if (!currentFile) return;
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }
    if (!(await runtime.ensureAccess())) return;

    setAiLoading(true);
    try {
      const jpeg = await imageFileToJpeg(currentFile, 900);
      if (!jpeg) {
        toast.error("Impossibile leggere questa immagine.");
        return;
      }
      const response = await analyzeTriageImage({ data: { locale: outputLocale, imageDataUrl: jpeg } });
      if (!response.ok) {
        toast.warning(`AI non disponibile: ${response.error}`);
        return;
      }
      setAiSuggestion(response.suggestion);
    } catch (error) {
      console.error(error);
      toast.warning("Analisi AI non riuscita, riprova tra qualche secondo.");
    } finally {
      setAiLoading(false);
    }
  }

  function process(category: Category) {
    if (!currentFile) return;
    const file = currentFile;
    setHistory((h) => [...h, { index: currentIndex, category, file }]);
    if (category === "promossa") setPromosse((arr) => [...arr, file]);
    else if (category === "rimandata") setRimandate((arr) => [...arr, file]);
    else setBocciate((arr) => [...arr, file]);
    setCurrentIndex((i) => i + 1);
  }

  // Scorciatoie da tastiera attive solo durante la revisione.
  useEffect(() => {
    if (phase !== "triage") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        process("promossa");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        process("bocciata");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        process("rimandata");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, process]);

  // Passa automaticamente all'esportazione quando la coda è esaurita.
  useEffect(() => {
    if (phase === "triage" && currentIndex >= orderedFiles.length && orderedFiles.length > 0) {
      setPhase("export");
    }
  }, [phase, currentIndex, orderedFiles.length]);

  function handleAppendFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const validImages = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (validImages.length === 0) {
      toast.error("Nessuna immagine valida trovata nei file selezionati.");
      return;
    }
    setQueue((q) => [...q, ...validImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClearQueue() {
    setQueue([]);
    setClearDialogOpen(false);
  }

  function handleStartTriage() {
    if (queue.length === 0) return;
    const size = Number.isFinite(batchSize) && batchSize > 0 ? Math.floor(batchSize) : 40;
    setBatchSize(size);

    const sorted = [...queue].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
    );

    setOrderedFiles(sorted);
    setCurrentIndex(0);
    setPromosse([]);
    setRimandate([]);
    setBocciate([]);
    setHistory([]);
    setPhase("triage");
  }

  function handleUndo() {
    setHistory((h) => {
      const last = h[h.length - 1];
      if (!last) return h;
      if (last.category === "promossa") setPromosse((arr) => arr.slice(0, -1));
      else if (last.category === "rimandata") setRimandate((arr) => arr.slice(0, -1));
      else setBocciate((arr) => arr.slice(0, -1));
      setCurrentIndex(last.index);
      return h.slice(0, -1);
    });
  }

  const chargeGuard = useRef(false);

  async function handleDownload() {
    // Guardia sincrona: blocca doppio click/rientranza prima di qualsiasi await.
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    // Verifica server-side del piano e dei crediti.
    if (!(await runtime.ensureAccess())) return;

    setDownloading(true);
    const operationId = newOperationId("triage-download");

    try {
      const result: TriageResult = { promosse, rimandate, bocciate };
      const blob = await buildTriageZip(result, batchSize, outputLocale);

      // Credito confermato PRIMA di consegnare il file: se il charge fallisse (limite raggiunto,
      // abbonamento non attivo, ecc.) nessun download deve partire.
      const charged = await runtime.charge(operationId, "Download completato delle 3 cartelle");
      if (!charged.ok) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Triage_KDP_Risultati.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(charged.duplicate ? "Download completato" : "Download completato — 1 credito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download non riuscito");
    } finally {
      setDownloading(false);
    }
  } finally {
      chargeGuard.current = false;
    }
  }

  function resetAll() {
    setPhase("upload");
    setQueue([]);
    setOrderedFiles([]);
    setCurrentIndex(0);
    setPromosse([]);
    setRimandate([]);
    setBocciate([]);
    setHistory([]);
  }

  const displayQueue = queue.slice(-20);
  const remaining = orderedFiles.length - currentIndex;

  return (
    <div className="space-y-6">
      {phase === "upload" && (
        <div className="panel space-y-5 p-6">
          <OutputLanguageSelect id="triage-output-lang" className="rounded-lg border border-border bg-surface p-4" />
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label htmlFor="triage-batch-size" className="text-accent">
                ⚙️ Pagine per cartella (soglia libro)
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Le immagini promosse saranno suddivise in lotti di questa dimensione esatta.
              </p>
            </div>
            <Input
              id="triage-batch-size"
              type="number"
              min={1}
              max={500}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-24 text-center font-bold"
            />
          </div>

          <div>
            <Label htmlFor="triage-files" className="sr-only">
              Carica le immagini
            </Label>
            <input
              id="triage-files"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleAppendFiles(e.target.files)}
              className="block w-full cursor-pointer rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Accumulo multiplo attivo: ripeti la selezione per aggiungere altri file. La revisione è
              gratuita: il credito viene scalato solo al download finale delle 3 cartelle.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 text-left">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold">
              <span>
                Immagini in coda pronte: <span className="text-accent">{queue.length}</span>
              </span>
              <button
                type="button"
                disabled={queue.length === 0}
                onClick={() => setClearDialogOpen(true)}
                className="text-xs font-bold text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                Svuota coda
              </button>
            </div>
            <div className="max-h-36 space-y-1 overflow-y-auto border-t border-border pt-2 text-xs text-muted-foreground">
              {queue.length === 0 ? (
                <p className="py-2 text-center italic">Nessuna immagine caricata finora.</p>
              ) : (
                <>
                  {displayQueue.map((file, idx) => {
                    const realIdx = queue.length - displayQueue.length + idx + 1;
                    return (
                      <div
                        key={`${file.name}-${realIdx}`}
                        className="flex justify-between border-b border-dotted border-border/60 py-1"
                      >
                        <span>
                          {realIdx}. {file.name}
                        </span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    );
                  })}
                  {queue.length > 20 && (
                    <p className="pt-1 text-center italic">
                      ...e altri {queue.length - 20} file in coda.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleStartTriage}
            disabled={queue.length === 0}
            className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
          >
            🚀 Avvia Selezione Triage
          </Button>
        </div>
      )}

      {phase === "triage" && currentFile && (
        <div className="panel space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 text-center text-xs font-semibold sm:grid-cols-5">
            <div>
              Totale
              <p className="text-lg">{orderedFiles.length}</p>
            </div>
            <div className="text-accent">
              Promosse
              <p className="text-lg">{promosse.length}</p>
            </div>
            <div className="text-amber-500">
              Rimandate
              <p className="text-lg">{rimandate.length}</p>
            </div>
            <div className="text-destructive">
              Bocciate
              <p className="text-lg">{bocciate.length}</p>
            </div>
            <div>
              Rimaste
              <p className="text-lg">{remaining}</p>
            </div>
          </div>

          <div className="relative flex min-h-[320px] items-center justify-center rounded-lg border border-border bg-black/60 p-4">
            <span className="absolute left-3 top-3 rounded bg-black/80 px-2 py-1 text-xs text-white">
              {currentIndex + 1} / {orderedFiles.length}
            </span>
            {previewUrl && (
              <img
                src={previewUrl}
                alt={currentFile.name}
                className="max-h-[380px] max-w-full rounded object-contain"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={history.length === 0}
              onClick={handleUndo}
            >
              <Undo2 className="mr-2 size-4" /> Torna indietro (ultima scelta)
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={aiLoading} onClick={handleAskAi}>
              {aiLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Chiedi un parere a Gemini
            </Button>
          </div>

          {aiSuggestion && (
            <p className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
              <strong className="text-foreground">
                Suggerimento AI: {CATEGORY_LABEL[aiSuggestion.category]}.
              </strong>{" "}
              {aiSuggestion.reason} — la scelta finale resta tua.
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              onClick={() => process("bocciata")}
              className="h-auto flex-col gap-1 bg-destructive py-4 text-destructive-foreground hover:opacity-90"
            >
              <span className="flex items-center gap-1">
                <ArrowLeft className="size-4" /> Bocciata
              </span>
              <small className="font-normal opacity-80">(← Sinistra)</small>
            </Button>
            <Button
              type="button"
              onClick={() => process("rimandata")}
              className="h-auto flex-col gap-1 bg-amber-600 py-4 text-white hover:opacity-90"
            >
              <span className="flex items-center gap-1">
                <ArrowDown className="size-4" /> Rimandata
              </span>
              <small className="font-normal opacity-80">(↓ Basso)</small>
            </Button>
            <Button
              type="button"
              onClick={() => process("promossa")}
              className="h-auto flex-col gap-1 bg-emerald-600 py-4 text-white hover:opacity-90"
            >
              <span className="flex items-center gap-1">
                Promossa <ArrowRight className="size-4" />
              </span>
              <small className="font-normal opacity-80">(→ Destra)</small>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Usa i tasti della tastiera: <strong>← Sinistra</strong> (Bocciata) ·{" "}
            <strong>↓ Basso</strong> (Rimandata) · <strong>→ Destra</strong> (Promossa)
          </p>
        </div>
      )}

      {phase === "export" && (
        <div className="panel space-y-5 p-6 text-center">
          <h2 className="text-xl font-black">Triage completato con successo! 🎉</h2>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">Riepilogo selezioni:</p>
            <p className="font-bold text-accent">
              🟢 Promosse: {promosse.length} (divise in base alla soglia impostata + eventuale Libro_x)
            </p>
            <p className="font-bold text-amber-500">🟡 Rimandate: {rimandate.length}</p>
            <p className="font-bold text-destructive">🔴 Bocciate: {bocciate.length}</p>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading || runtime.charging}
            className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
          >
            {downloading || runtime.charging ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Scarica archivio ZIP (1 credito)
          </Button>

          <Button type="button" variant="ghost" onClick={resetAll} className="w-full">
            <Redo2 className="mr-2 size-4" /> Nuovo triage
          </Button>
        </div>
      )}

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Svuotare la coda?</AlertDialogTitle>
            <AlertDialogDescription>
              Vuoi svuotare tutta la coda delle immagini caricate? L'operazione non può essere
              annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearQueue}>Svuota coda</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  }

// Etichette categoria mantenute per eventuali usi futuri (report, tooltip, ecc.).
export const TRIAGE_CATEGORY_LABEL = CATEGORY_LABEL;
