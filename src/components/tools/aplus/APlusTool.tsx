import { Copy, Download, FolderDown, Loader2, RotateCcw, Sparkles, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";

import { AGES, NICHES } from "@/components/tools/aplus/constants";
import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { generateModulesText, nextCopyVariationIndex } from "@/components/tools/aplus/copyEngine";
import type { AgeId, GeneratedModulesText, LangId, NicheId } from "@/components/tools/aplus/types";
import type { ValueModuleStyle } from "@/components/tools/aplus/canvasRenderers";
import {
  downloadCanvas,
  exportModulesAsZip,
  formatCompText,
  formatGridText,
  formatHeroProofText,
  formatValueText,
  saveAllToDirectory,
  type ModuleCanvases,
} from "@/components/tools/aplus/zipExport";
import { extractCoverContent, extractPdfContent } from "@/components/tools/pdfContent";
import { generateAplusCopy } from "@/lib/aiCopy.functions";
import { AiStyleControls } from "@/components/tools/ai/AiStyleControls";
import { DEFAULT_CREATIVITY, DEFAULT_TONE, type AiToneId } from "@/components/tools/ai/aiStyle";

/**
 * TOOL — A+1 KDP Studio (modulo indipendente).
 * Porting fedele di A_KDPstudio_migliorato.html: rendering canvas dei 5 moduli
 * A+ (hero, proof, value, grid x3, compare), copy multilingua/età e export ZIP.
 * 1 credito per ogni generazione completata con successo.
 */

/** Mercati con database copy A+ completo. */
const APLUS_OUTPUT_LOCALES = ["it", "en", "de", "fr", "es"] as const;

export function APlusTool({ runtime }: { runtime: ToolRuntime }) {
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState<NicheId>("coloring");
  // La lingua dei contenuti A+ segue il selettore globale (5 mercati supportati).
  const lang = useOutputLanguage(APLUS_OUTPUT_LOCALES) as LangId;
  const [age, setAge] = useState<AgeId>("4-6");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoScale, setLogoScale] = useState(100);
  const [logoOffset, setLogoOffset] = useState({ x: 0, y: 0 });

  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(2);
  const [page3, setPage3] = useState(3);

  const [bgColor, setBgColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#0f172a");

  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("In attesa dei file sorgente...");
  const [texts, setTexts] = useState<GeneratedModulesText | null>(null);
  const [canvasesReady, setCanvasesReady] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [aiUsed, setAiUsed] = useState(false);
  const [tone, setTone] = useState<AiToneId>(DEFAULT_TONE);
  const [creativity, setCreativity] = useState(DEFAULT_CREATIVITY);

  // Modulo 3: stile tipografico personalizzabile del blocco "Value Highlights".
  const DEFAULT_VALUE_STYLE: ValueModuleStyle = {
    titleSize: 21,
    itemSize: 13,
    marker: "✓",
    numbered: false,
    uppercase: true,
  };
  const [valueStyle, setValueStyle] = useState<ValueModuleStyle>(DEFAULT_VALUE_STYLE);
  // Copy generato dal motore: consente il ripristino dopo le modifiche manuali.
  const baseValue = useRef<GeneratedModulesText["value"] | null>(null);

  const redrawValue = useCallback(
    async (value: GeneratedModulesText["value"], style: ValueModuleStyle) => {
      const canvas = document.getElementById("aplus-value") as HTMLCanvasElement | null;
      if (!canvas) return;
      const { drawValueModule } = await import("@/components/tools/aplus/canvasRenderers");
      drawValueModule(canvas, bgColor, accentColor, value, style);
    },
    [bgColor, accentColor],
  );

  useEffect(() => {
    if (canvasesReady && texts) void redrawValue(texts.value, valueStyle);
  }, [canvasesReady, texts, valueStyle, redrawValue]);

  function updateValueText(field: "title" | "text1" | "text2" | "text3" | "alt", next: string) {
    setTexts((prev) => (prev ? { ...prev, value: { ...prev.value, [field]: next } } : prev));
  }

  function updateValueTextAll(next: GeneratedModulesText["value"]) {
    setTexts((prev) => (prev ? { ...prev, value: { ...next } } : prev));
  }

  /** Tutti i testi dei moduli restano modificabili prima della copia o del download. */
  function updateHeroText(field: "heading" | "body" | "alt", next: string) {
    setTexts((prev) => (prev ? { ...prev, hero: { ...prev.hero, [field]: next } } : prev));
  }

  function updateProofText(field: "heading" | "body" | "alt", next: string) {
    setTexts((prev) => (prev ? { ...prev, proof: { ...prev.proof, [field]: next } } : prev));
  }

  function updateGridItem(index: number, field: "title" | "desc", next: string) {
    setTexts((prev) =>
      prev
        ? {
            ...prev,
            grid: {
              ...prev.grid,
              items: prev.grid.items.map((item, i) =>
                i === index ? { ...item, [field]: next } : item,
              ),
            },
          }
        : prev,
    );
  }

  function updateCompText(field: "instructions" | "alt", next: string) {
    setTexts((prev) => (prev ? { ...prev, comp: { ...prev.comp, [field]: next } } : prev));
  }

  // Sorgenti dell'ultimo rendering hero: permettono di riposizionare il logo senza rigenerare.
  const heroSources = useRef<{
    front: HTMLCanvasElement | HTMLImageElement;
    back: HTMLCanvasElement | HTMLImageElement;
    logo: HTMLCanvasElement | null;
    drawHero: (typeof import("@/components/tools/aplus/canvasRenderers"))["drawHero"];
  } | null>(null);
  const logoDrag = useRef<{
    startX: number;
    startY: number;
    x: number;
    y: number;
    ratio: number;
  } | null>(null);

  function redrawHero(offset: { x: number; y: number }, scalePercent: number) {
    const src = heroSources.current;
    const canvas = document.getElementById("aplus-hero") as HTMLCanvasElement | null;
    if (!src || !canvas) return;
    src.drawHero(canvas, src.front, src.back, bgColor, src.logo, scalePercent / 100, offset);
  }

  useEffect(() => {
    if (canvasesReady) redrawHero(logoOffset, logoScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoOffset, logoScale, bgColor, canvasesReady]);

  function handleHeroPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canvasesReady || !heroSources.current?.logo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    logoDrag.current = {
      startX: e.clientX,
      startY: e.clientY,
      x: logoOffset.x,
      y: logoOffset.y,
      ratio: 970 / rect.width,
    };
  }

  function handleHeroPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = logoDrag.current;
    if (!drag) return;
    const x = Math.round(drag.x + (e.clientX - drag.startX) * drag.ratio);
    const y = Math.round(drag.y + (e.clientY - drag.startY) * drag.ratio);
    setLogoOffset({ x, y });
  }

  function handleHeroPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    logoDrag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  const chargeGuard = useRef(false);

  async function handleGenerate() {
    // Guardia sincrona: blocca doppio click/rientranza prima di qualsiasi await.
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
      if (!coverFile || !interiorFile) {
        toast.error("Carica sia il PDF di copertina che il PDF interno.");
        return;
      }
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }

      // Verifica server-side del piano e dei crediti.
      if (!(await runtime.ensureAccess())) return;

      setGenerating(true);
      setStatus(`Rendering A+1 in corso per il mercato [${lang.toUpperCase()}]...`);
      const operationId = newOperationId("aplus-gen");

      try {
        const [
          { renderPdfPage, loadLogoFromFile },
          { drawHero, drawProof, drawValueModule, drawGridSquare, drawCompareHeader },
        ] = await Promise.all([
          import("@/components/tools/aplus/pdfEngine"),
          import("@/components/tools/aplus/canvasRenderers"),
        ]);

        const logoImg = logoFile ? await loadLogoFromFile(logoFile) : null;
        const frontCoverImg = await renderPdfPage(coverFile, 1, true, false);
        const backCoverImg = await renderPdfPage(coverFile, 1, true, true);

        const intImg1 = await renderPdfPage(interiorFile, page1, false);
        const intImg2 = await renderPdfPage(interiorFile, page2, false);
        const intImg3 = await renderPdfPage(interiorFile, page3, false);

        const variationIndex = nextCopyVariationIndex();
        let generatedTexts = generateModulesText({
          lang,
          niche,
          age,
          pages: [page1, page2, page3],
          variationIndex,
        });

        let usedAi = false;
        if (useAi) {
          try {
            setStatus("Analisi AI di copertina e pagine interne...");
            const cover = await extractCoverContent(coverFile);
            const interior = interiorFile
              ? await extractPdfContent(interiorFile, {
                  maxImages: 3,
                  maxTextPages: 6,
                  pageIndexes: [page1, page2, page3],
                })
              : { text: "", images: [] as string[] };

            setStatus("Scrittura testi A+ (SEO + AIDA + PAS)...");
            const response = await generateAplusCopy({
              data: {
                lang,
                niche,
                age,
                title,
                tone,
                creativity,
                interiorText: interior.text || undefined,
                interiorImages: interior.images,
                coverImages: cover.images,
              },
            });

            if (response.ok) {
              const copy = response.copy;
              generatedTexts = {
                ...generatedTexts,
                hero: {
                  ...generatedTexts.hero,
                  heading: copy.hero.heading || generatedTexts.hero.heading,
                  body: copy.hero.body || generatedTexts.hero.body,
                  alt: copy.hero.alt || generatedTexts.hero.alt,
                },
                proof: {
                  ...generatedTexts.proof,
                  heading: copy.proof.heading || generatedTexts.proof.heading,
                  body: copy.proof.body || generatedTexts.proof.body,
                  alt: copy.proof.alt || generatedTexts.proof.alt,
                },
                value: {
                  title: copy.value.title || generatedTexts.value.title,
                  text1: copy.value.text1 || generatedTexts.value.text1,
                  text2: copy.value.text2 || generatedTexts.value.text2,
                  text3: copy.value.text3 || generatedTexts.value.text3,
                  alt: copy.value.alt || generatedTexts.value.alt,
                },
                grid: {
                  ...generatedTexts.grid,
                  items: generatedTexts.grid.items.map((item, i) => ({
                    title: copy.grid[i]?.title || item.title,
                    desc: copy.grid[i]?.desc || item.desc,
                  })),
                },
                comp: {
                  ...generatedTexts.comp,
                  instructions: copy.comp || generatedTexts.comp.instructions,
                },
              };
              usedAi = true;
            } else {
              toast.warning(
                `AI non disponibile: ${response.error}. Usati i testi del motore interno.`,
              );
            }
          } catch (aiError) {
            console.error(aiError);
            toast.warning("Analisi AI non riuscita: usati i testi del motore interno.");
          }
          setStatus(`Rendering A+1 in corso per il mercato [${lang.toUpperCase()}]...`);
        }

        const heroCanvas = document.getElementById("aplus-hero") as HTMLCanvasElement | null;
        const proofCanvas = document.getElementById("aplus-proof") as HTMLCanvasElement | null;
        const valueCanvas = document.getElementById("aplus-value") as HTMLCanvasElement | null;
        const grid1Canvas = document.getElementById("aplus-grid1") as HTMLCanvasElement | null;
        const grid2Canvas = document.getElementById("aplus-grid2") as HTMLCanvasElement | null;
        const grid3Canvas = document.getElementById("aplus-grid3") as HTMLCanvasElement | null;
        const compCanvas = document.getElementById("aplus-comp") as HTMLCanvasElement | null;

        if (
          !heroCanvas ||
          !proofCanvas ||
          !valueCanvas ||
          !grid1Canvas ||
          !grid2Canvas ||
          !grid3Canvas ||
          !compCanvas
        ) {
          throw new Error("Anteprima canvas non disponibile.");
        }

        heroSources.current = { front: frontCoverImg, back: backCoverImg, logo: logoImg, drawHero };
        drawHero(
          heroCanvas,
          frontCoverImg,
          backCoverImg,
          bgColor,
          logoImg,
          logoScale / 100,
          logoOffset,
        );
        drawProof(proofCanvas, intImg1, intImg2, bgColor);
        drawValueModule(valueCanvas, bgColor, accentColor, generatedTexts.value, valueStyle);
        baseValue.current = generatedTexts.value;

        drawGridSquare(grid1Canvas, intImg1, bgColor);
        drawGridSquare(grid2Canvas, intImg2, bgColor);
        drawGridSquare(grid3Canvas, intImg3, bgColor);
        drawCompareHeader(compCanvas, frontCoverImg, bgColor);

        // Generazione completata → consumo del credito.
        const result = await runtime.charge(operationId, "Generazione moduli A+ completata");
        if (!result.ok) return;

        setTexts(generatedTexts);
        setAiUsed(usedAi);
        setCanvasesReady(true);
        setStatus(
          usedAi
            ? `Generazione A+1 completata con testi AI sui contenuti reali [${lang.toUpperCase()}]!`
            : `Generazione A+1 completata per il mercato [${lang.toUpperCase()}]!`,
        );
        toast.success(
          result.duplicate ? "Generazione completata" : "Generazione completata — 1 credito",
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Errore durante l'elaborazione dei file.";
        setStatus(`Errore: ${message}`);
        toast.error(message);
      } finally {
        setGenerating(false);
      }
    } finally {
      chargeGuard.current = false;
    }
  }

  async function handleExportZip() {
    if (!texts || !canvasesReady) {
      toast.error("Genera prima i moduli A+.");
      return;
    }

    setExporting(true);
    try {
      const canvases = getModuleCanvases();
      await exportModulesAsZip(canvases, texts, { title, lang, niche, age });
      toast.success("Pacchetto ZIP scaricato");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Esportazione ZIP non riuscita");
    } finally {
      setExporting(false);
    }
  }

  const [savingFolder, setSavingFolder] = useState(false);

  async function handleSaveToDirectory() {
    if (!texts || !canvasesReady) {
      toast.error("Genera prima i moduli A+.");
      return;
    }
    setSavingFolder(true);
    try {
      const canvases = getModuleCanvases();
      await saveAllToDirectory(canvases, texts, { title, lang, niche, age });
      toast.success("File salvati");
    } catch (error) {
      // L'utente che annulla la scelta della cartella non è un errore da segnalare.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "Salvataggio non riuscito");
    } finally {
      setSavingFolder(false);
    }
  }

  function getModuleCanvases(): ModuleCanvases {
    return {
      hero: document.getElementById("aplus-hero") as HTMLCanvasElement,
      proof: document.getElementById("aplus-proof") as HTMLCanvasElement,
      value: document.getElementById("aplus-value") as HTMLCanvasElement,
      grid1: document.getElementById("aplus-grid1") as HTMLCanvasElement,
      grid2: document.getElementById("aplus-grid2") as HTMLCanvasElement,
      grid3: document.getElementById("aplus-grid3") as HTMLCanvasElement,
      comp: document.getElementById("aplus-comp") as HTMLCanvasElement,
    };
  }

  function copyToClipboard(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label}: testi copiati negli appunti`);
  }

  async function handleDownloadGrid3() {
    const canvases = getModuleCanvases();
    const files: [HTMLCanvasElement, string][] = [
      [canvases.grid1, "Modulo_04_Feature_01_300x300.png"],
      [canvases.grid2, "Modulo_04_Feature_02_300x300.png"],
      [canvases.grid3, "Modulo_04_Feature_03_300x300.png"],
    ];
    for (const [canvas, filename] of files) {
      downloadCanvas(canvas, filename);
      // Piccola pausa: i browser bloccano download multipli troppo ravvicinati.
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  function handleFileChange(setter: (f: File | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.files?.[0] ?? null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="panel space-y-5 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          A+1 KDP Studio — Multi-Language Engine
        </h3>
        <p className="text-xs text-muted-foreground">
          Rendering mockup dei moduli A+ e copywriting SEO multilingua.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="a-title">Titolo / Nome Brand</Label>
          <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-niche">Nicchia Editoriale</Label>
            <Select value={niche} onValueChange={(v) => setNiche(v as NicheId)}>
              <SelectTrigger id="a-niche">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NICHES.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <OutputLanguageSelect id="aplus-output-lang" supported={APLUS_OUTPUT_LOCALES} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="a-age">Target di Età / Pubblico</Label>
          <Select value={age} onValueChange={(v) => setAge(v as AgeId)}>
            <SelectTrigger id="a-age">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGES.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="a-cover-file">PDF Copertina Completa</Label>
          <label
            htmlFor="a-cover-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
          >
            <Upload className="size-4" />
            {coverFile ? `Caricato: ${coverFile.name}` : "Clicca per caricare la copertina (PDF)"}
            <span className="font-normal text-[11px] text-muted-foreground/80">
              Deve essere un PDF con fronte + dorso + retro in un'unica pagina (l'export di stampa
              di Copertine o KDP): serve per ritagliare fronte e retro nel punto esatto del dorso.
              Un'immagine singola (es. il PNG di anteprima di Copertine) non è sufficiente.
            </span>
            <input
              id="a-cover-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFileChange(setCoverFile)}
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="a-interior-file">PDF Interno Libro</Label>
          <label
            htmlFor="a-interior-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
          >
            <Upload className="size-4" />
            {interiorFile
              ? `Caricato: ${interiorFile.name}`
              : "Clicca per caricare l'interno (PDF)"}
            <input
              id="a-interior-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFileChange(setInteriorFile)}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-p1">Pag. A</Label>
            <Input
              id="a-p1"
              type="number"
              min={1}
              value={page1}
              onChange={(e) => setPage1(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-p2">Pag. B</Label>
            <Input
              id="a-p2"
              type="number"
              min={1}
              value={page2}
              onChange={(e) => setPage2(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-p3">Pag. C</Label>
            <Input
              id="a-p3"
              type="number"
              min={1}
              value={page3}
              onChange={(e) => setPage3(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="a-logo-file">Logo Azienda (JPG / PNG / SVG)</Label>
          <label
            htmlFor="a-logo-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
          >
            <Upload className="size-4" />
            {logoFile ? `Caricato: ${logoFile.name}` : "Clicca per caricare il logo (opzionale)"}
            <input
              id="a-logo-file"
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              className="sr-only"
              onChange={handleFileChange(setLogoFile)}
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>Dimensione Logo Modulo 1: {logoScale}%</Label>
          <Slider
            aria-label={`Dimensione logo: ${logoScale}%`}
            min={20}
            max={250}
            step={5}
            value={[logoScale]}
            onValueChange={(v) => setLogoScale(v[0] ?? 100)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>
            Posizione Logo Modulo 1 (X: {logoOffset.x}px — Y: {logoOffset.y}px)
          </Label>
          <Slider
            aria-label={`Posizione logo orizzontale: ${logoOffset.x}px`}
            min={-420}
            max={420}
            step={2}
            value={[logoOffset.x]}
            onValueChange={(v) => setLogoOffset((o) => ({ ...o, x: v[0] ?? 0 }))}
          />
          <Slider
            aria-label={`Posizione logo verticale: ${logoOffset.y}px`}
            min={-130}
            max={130}
            step={2}
            value={[logoOffset.y]}
            onValueChange={(v) => setLogoOffset((o) => ({ ...o, y: v[0] ?? 0 }))}
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Puoi anche trascinare il logo direttamente sull'anteprima del Modulo 1.
            </p>
            <Button size="sm" variant="ghost" onClick={() => setLogoOffset({ x: 0, y: 0 })}>
              Centra
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="a-bg">Sfondo Moduli</Label>
            <Input
              id="a-bg"
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-full p-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-accent">Colore Evidenziatore</Label>
            <Input
              id="a-accent"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-full p-1"
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
          <div className="space-y-0.5">
            <Label htmlFor="aplus-use-ai" className="text-sm">
              AI sui contenuti reali (gratuita)
            </Label>
            <p className="text-xs text-muted-foreground">
              Legge copertina e pagine interne per testi inerenti, con impronta SEO + AIDA + PAS.
            </p>
          </div>
          <Switch id="aplus-use-ai" checked={useAi} onCheckedChange={setUseAi} />
        </div>

        <AiStyleControls
          idPrefix="aplus-ai"
          tone={tone}
          onToneChange={setTone}
          creativity={creativity}
          onCreativityChange={setCreativity}
          disabled={!useAi}
        />
        {aiUsed && (
          <p className="text-xs text-accent">
            ✨ Testi dell&apos;ultima generazione scritti dall&apos;AI sui contenuti analizzati.
          </p>
        )}

        <Button
          onClick={handleGenerate}
          disabled={generating || runtime.charging}
          className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
        >
          {generating || runtime.charging ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          Genera contenuti A+ multilingua (1 credito)
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportZip}
          disabled={exporting || !canvasesReady}
        >
          {exporting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Scarica tutto in un unico ZIP
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleSaveToDirectory}
          disabled={savingFolder || !canvasesReady}
        >
          {savingFolder ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <FolderDown className="mr-2 size-4" />
          )}
          Salva tutti i file in una cartella
        </Button>

        <p className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
          {status}
        </p>
        <p className="text-xs text-muted-foreground">
          Una generazione completata = 1 credito. Le generazioni non riuscite non vengono
          addebitate.
        </p>
      </div>

      <div className="space-y-4">
        <article className="panel space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Modulo 1: Hero Banner Brand (970×300 px)</h4>
            <Button
              size="sm"
              variant="outline"
              disabled={!canvasesReady}
              onClick={() =>
                downloadCanvas(getModuleCanvases().hero, "Modulo_01_Hero_Banner_970x300.png")
              }
            >
              <Download className="mr-1.5 size-3.5" /> Scarica PNG
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border border-border bg-surface p-2">
            <canvas
              id="aplus-hero"
              width={970}
              height={300}
              className={`h-auto w-full max-w-2xl touch-none ${canvasesReady && logoFile ? "cursor-move" : ""}`}
              onPointerDown={handleHeroPointerDown}
              onPointerMove={handleHeroPointerMove}
              onPointerUp={handleHeroPointerUp}
              onPointerCancel={handleHeroPointerUp}
            />
          </div>
          {texts && (
            <div className="space-y-3 rounded-md border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {texts.hero.title} — testi modificabili
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(formatHeroProofText(texts.hero), "Modulo 1")}
                >
                  <Copy className="mr-1.5 size-3.5" /> Copia Testi
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-hero-heading">Titolo A+</Label>
                <Input
                  id="a-hero-heading"
                  value={texts.hero.heading}
                  onChange={(e) => updateHeroText("heading", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-hero-body">Testo descrittivo</Label>
                <Textarea
                  id="a-hero-body"
                  rows={4}
                  value={texts.hero.body}
                  onChange={(e) => updateHeroText("body", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-hero-alt">Alt-text SEO</Label>
                <Input
                  id="a-hero-alt"
                  value={texts.hero.alt}
                  onChange={(e) => updateHeroText("alt", e.target.value)}
                />
              </div>
            </div>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Modulo 2: Proof Banner Interni (970×300 px)</h4>
            <Button
              size="sm"
              variant="outline"
              disabled={!canvasesReady}
              onClick={() =>
                downloadCanvas(getModuleCanvases().proof, "Modulo_02_Proof_Banner_970x300.png")
              }
            >
              <Download className="mr-1.5 size-3.5" /> Scarica PNG
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-proof" width={970} height={300} className="h-auto w-full max-w-2xl" />
          </div>
          {texts && (
            <div className="space-y-3 rounded-md border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {texts.proof.title} — testi modificabili
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(formatHeroProofText(texts.proof), "Modulo 2")}
                >
                  <Copy className="mr-1.5 size-3.5" /> Copia Testi
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-proof-heading">Titolo A+</Label>
                <Input
                  id="a-proof-heading"
                  value={texts.proof.heading}
                  onChange={(e) => updateProofText("heading", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-proof-body">Testo descrittivo</Label>
                <Textarea
                  id="a-proof-body"
                  rows={4}
                  value={texts.proof.body}
                  onChange={(e) => updateProofText("body", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-proof-alt">Alt-text SEO</Label>
                <Input
                  id="a-proof-alt"
                  value={texts.proof.alt}
                  onChange={(e) => updateProofText("alt", e.target.value)}
                />
              </div>
            </div>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Modulo 3: Value Highlights (970×300 px)</h4>
            <Button
              size="sm"
              variant="outline"
              disabled={!canvasesReady}
              onClick={() =>
                downloadCanvas(getModuleCanvases().value, "Modulo_03_Value_Highlights_970x300.png")
              }
            >
              <Download className="mr-1.5 size-3.5" /> Scarica PNG
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-value" width={970} height={300} className="h-auto w-full max-w-2xl" />
          </div>
          {texts && (
            <div className="space-y-4 rounded-md border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Personalizza testi e stile
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(formatValueText(texts.value), "Modulo 3")}
                  >
                    <Copy className="mr-1.5 size-3.5" /> Copia Testi
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (baseValue.current) updateValueTextAll(baseValue.current);
                      setValueStyle(DEFAULT_VALUE_STYLE);
                    }}
                  >
                    <RotateCcw className="mr-1 size-3.5" />
                    Ripristina
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="a-value-title">Titolo sezione</Label>
                <Input
                  id="a-value-title"
                  value={texts.value.title}
                  onChange={(e) => updateValueText("title", e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(["text1", "text2", "text3"] as const).map((field, i) => (
                  <div key={field} className="space-y-1.5">
                    <Label htmlFor={`a-value-${field}`}>Punto {i + 1}</Label>
                    <Textarea
                      id={`a-value-${field}`}
                      rows={3}
                      value={texts.value[field]}
                      onChange={(e) => updateValueText(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Dimensione titolo: {valueStyle.titleSize}px</Label>
                  <Slider
                    aria-label={`Dimensione titolo: ${valueStyle.titleSize}px`}
                    min={14}
                    max={40}
                    step={1}
                    value={[valueStyle.titleSize ?? 21]}
                    onValueChange={(v) => setValueStyle((s) => ({ ...s, titleSize: v[0] ?? 21 }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Dimensione punti: {valueStyle.itemSize}px</Label>
                  <Slider
                    aria-label={`Dimensione punti: ${valueStyle.itemSize}px`}
                    min={9}
                    max={26}
                    step={1}
                    value={[valueStyle.itemSize ?? 13]}
                    onValueChange={(v) => setValueStyle((s) => ({ ...s, itemSize: v[0] ?? 13 }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="a-value-badge">Badge dei punti</Label>
                  <Select
                    value={
                      valueStyle.numbered
                        ? "numbers"
                        : valueStyle.marker
                          ? valueStyle.marker
                          : "none"
                    }
                    onValueChange={(v) =>
                      setValueStyle((s) => ({
                        ...s,
                        numbered: v === "numbers",
                        marker: v === "numbers" ? "✓" : v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger id="a-value-badge">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="✓">Spunta ✓</SelectItem>
                      <SelectItem value="★">Stella ★</SelectItem>
                      <SelectItem value="●">Punto ●</SelectItem>
                      <SelectItem value="✚">Croce ✚</SelectItem>
                      <SelectItem value="numbers">Numeri 1 · 2 · 3</SelectItem>
                      <SelectItem value="none">Nessun badge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <Label htmlFor="a-value-upper" className="text-sm">
                    Punti in MAIUSCOLO
                  </Label>
                  <Switch
                    id="a-value-upper"
                    checked={valueStyle.uppercase !== false}
                    onCheckedChange={(checked) =>
                      setValueStyle((s) => ({ ...s, uppercase: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
          {texts && (
            <div className="space-y-1.5 rounded-md border border-border bg-surface p-4">
              <Label htmlFor="a-value-alt">Alt-text SEO</Label>
              <Input
                id="a-value-alt"
                value={texts.value.alt}
                onChange={(e) => updateValueText("alt", e.target.value)}
              />
            </div>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Modulo 4: Feature Grid (3× 300×300 px)</h4>
            <Button
              size="sm"
              variant="outline"
              disabled={!canvasesReady}
              onClick={handleDownloadGrid3}
            >
              <Download className="mr-1.5 size-3.5" /> Scarica 3 Asset PNG
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-border bg-surface p-2">
              <canvas id="aplus-grid1" width={300} height={300} className="h-auto w-full" />
            </div>
            <div className="rounded-md border border-border bg-surface p-2">
              <canvas id="aplus-grid2" width={300} height={300} className="h-auto w-full" />
            </div>
            <div className="rounded-md border border-border bg-surface p-2">
              <canvas id="aplus-grid3" width={300} height={300} className="h-auto w-full" />
            </div>
          </div>
          {texts && (
            <div className="grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
              <div className="sm:col-span-3 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(formatGridText(texts.grid, lang, age), "Modulo 4")}
                >
                  <Copy className="mr-1.5 size-3.5" /> Copia Testi
                </Button>
              </div>
              {texts.grid.items.map((item, i) => (
                <div key={`grid-${i}`} className="space-y-1.5">
                  <Label htmlFor={`a-grid-title-${i}`}>
                    Slot {i + 1} (Pag. {texts.grid.pages[i]})
                  </Label>
                  <Input
                    id={`a-grid-title-${i}`}
                    value={item.title}
                    onChange={(e) => updateGridItem(i, "title", e.target.value)}
                  />
                  <Textarea
                    rows={3}
                    value={item.desc}
                    onChange={(e) => updateGridItem(i, "desc", e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Modulo 5: Header Compare (150×300 px)</h4>
            <Button
              size="sm"
              variant="outline"
              disabled={!canvasesReady}
              onClick={() =>
                downloadCanvas(getModuleCanvases().comp, "Modulo_05_Header_Compare_150x300.png")
              }
            >
              <Download className="mr-1.5 size-3.5" /> Scarica PNG
            </Button>
          </div>
          <div className="w-40 rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-comp" width={150} height={300} className="h-auto w-full" />
          </div>
          {texts && (
            <div className="space-y-3 rounded-md border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Testi modulo comparativo
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(formatCompText(texts.comp, title), "Modulo 5")}
                >
                  <Copy className="mr-1.5 size-3.5" /> Copia Testi
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-comp-instructions">Istruzioni modulo comparativo</Label>
                <Textarea
                  id="a-comp-instructions"
                  rows={4}
                  value={texts.comp.instructions}
                  onChange={(e) => updateCompText("instructions", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-comp-alt">Alt-text SEO</Label>
                <Input
                  id="a-comp-alt"
                  value={texts.comp.alt}
                  onChange={(e) => updateCompText("alt", e.target.value)}
                />
              </div>
            </div>
          )}
        </article>

        {!texts && (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            Carica i file e genera per visualizzare le anteprime e i testi multilingua.
          </div>
        )}
      </div>
    </div>
  );
}
