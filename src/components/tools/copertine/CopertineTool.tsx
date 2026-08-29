import { Download, Loader2, Ruler, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { newOperationId } from "@/hooks/useAccount";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";

import { DraggableBox } from "./DraggableBox";
import { TextFieldEditor } from "./TextFieldEditor";
import {
  EXPORT_DPI,
  ensureFontsLoaded,
  KDP_BLEED_IN,
  KDP_PAPER_LABELS,
  KDP_PAPER_THICKNESS,
  KDP_SAFE_MARGIN_IN,
  KDP_TRIM_SIZES,
  PALETTES,
  PREVIEW_MAX_WIDTH,
} from "./constants";
import type { BackgroundImageState, ImageLayerState, PaperType, SubtitleElementState, TextElementState, TrimId } from "./types";

/**
 * TOOL 1 — Copertine KDP (modulo indipendente).
 * Il credito viene consumato SOLO dopo un'esportazione immagine completata.
 */

function fxStyle(fx: TextElementState["fx"], color: string): React.CSSProperties {
  switch (fx) {
    case "fx-outline":
      return {
        color,
        textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 10px rgba(0,0,0,0.8)",
      };
    case "fx-glow":
      return { color, textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}` };
    case "fx-shadow":
      return { color, textShadow: "4px 4px 8px rgba(0,0,0,0.95), 2px 2px 3px rgba(0,0,0,0.8)" };
    default:
      return { color };
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CopertineTool({ runtime }: { runtime: ToolRuntime }) {
  const idPrefix = useId();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const imgFilesInputRef = useRef<HTMLInputElement | null>(null);

  const [trim, setTrim] = useState<TrimId>("8.5x11");
  const [pageCount, setPageCount] = useState(110);
  const [paperType, setPaperType] = useState<PaperType>("white");
  const [palette, setPalette] = useState(PALETTES[0]!.id);
  const [showGuides, setShowGuides] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [title, setTitle] = useState<TextElementState>({
    text: "",
    font: "Inter",
    color: "#fbbf24",
    size: 42,
    fx: "fx-none",
    top: 40,
    left: 20,
  });
  const [author, setAuthor] = useState<TextElementState>({
    text: "",
    font: "Inter",
    color: "#fcd34d",
    size: 12,
    fx: "fx-none",
    top: 500,
    left: 20,
  });
  const [spine, setSpine] = useState<TextElementState>({
    text: "",
    font: "Inter",
    color: "#ffffff",
    size: 10,
    fx: "fx-none",
    top: 220,
    left: -60,
  });
  const [backBlurb, setBackBlurb] = useState<TextElementState>({
    text: "",
    font: "Inter",
    color: "#ffffff",
    size: 11,
    fx: "fx-none",
    top: 40,
    left: 20,
  });
  const [subtitles, setSubtitles] = useState<SubtitleElementState[]>([]);
  const [bgImage, setBgImage] = useState<BackgroundImageState | null>(null);
  const [imageLayers, setImageLayers] = useState<ImageLayerState[]>([]);


  // --- Calcolo specifiche KDP ---
  const trimSize = KDP_TRIM_SIZES.find((t) => t.id === trim)!;
  const paperThickness = KDP_PAPER_THICKNESS[paperType];
  const spineInches = pageCount * paperThickness;
  const spinePx300 = Math.round(spineInches * EXPORT_DPI);
  const totalWidthIn = trimSize.w * 2 + spineInches + KDP_BLEED_IN * 2;
  const totalHeightIn = trimSize.h + KDP_BLEED_IN * 2;
  const canvasWpx = Math.round(totalWidthIn * EXPORT_DPI);
  const canvasHpx = Math.round(totalHeightIn * EXPORT_DPI);

  const scale = PREVIEW_MAX_WIDTH / totalWidthIn;
  const previewW = PREVIEW_MAX_WIDTH;
  const previewH = totalHeightIn * scale;
  const frontWidthPx = trimSize.w * scale;
  const spineWidthPx = spineInches * scale;
  const bleedPx = KDP_BLEED_IN * scale;
  const safeMarginPx = (KDP_BLEED_IN + KDP_SAFE_MARGIN_IN) * scale;
  const pal = PALETTES.find((p) => p.id === palette)!;

  function updateSubtitle(id: string, next: SubtitleElementState) {
    setSubtitles((prev) => prev.map((s) => (s.id === id ? next : s)));
  }
  function addSubtitle() {
    setSubtitles((prev) => [
      ...prev,
      {
        id: `sub_${Date.now()}`,
        text: "Nuovo sottotitolo",
        font: "Inter",
        color: "#ffffff",
        size: 14,
        fx: "fx-none",
        top: 150 + prev.length * 30,
        left: 20,
      },
    ]);
  }
  function removeSubtitle(id: string) {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const src = await readFileAsDataUrl(file);
      setBgImage({ src, width: previewW, top: 0, left: 0 });
    } catch {
      toast.error("Impossibile caricare l'immagine di sfondo");
    } finally {
      e.target.value = "";
    }
  }

  async function handleImageLayersUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      const newLayers = await Promise.all(
        files.map(async (file, i) => ({
          id: `layer_${Date.now()}_${i}`,
          src: await readFileAsDataUrl(file),
          name: file.name,
          width: 200,
          top: 100 + i * 20,
          left: frontWidthPx + spineWidthPx + 20,
        })),
      );
      setImageLayers((prev) => [...prev, ...newLayers]);
    } catch {
      toast.error("Impossibile caricare una o più immagini");
    } finally {
      e.target.value = "";
    }
  }

  function updateImageLayer(id: string, patch: Partial<ImageLayerState>) {
    setImageLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeImageLayer(id: string) {
    setImageLayers((prev) => prev.filter((l) => l.id !== id));
  }

  // Zoom con rotella sullo sfondo, ancorato al puntatore.
  const bgRef = useRef<BackgroundImageState | null>(null);
  bgRef.current = bgImage;

  // Carica tutti i font del database (Google Fonts) una sola volta al mount.
  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const bg = bgRef.current;
      if (!bg) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const factor = Math.exp(-dy * 0.0015);
      const nextWidth = Math.min(6000, Math.max(60, bg.width * factor));
      const k = nextWidth / bg.width;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setBgImage({
        ...bg,
        width: Math.round(nextWidth),
        left: Math.round(px - (px - bg.left) * k),
        top: Math.round(py - (py - bg.top) * k),
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const chargeGuard = useRef(false);


  async function handleExport() {
    // Guardia sincrona: blocca doppio click/rientranza prima di qualsiasi await.
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }
    if (!(await runtime.ensureAccess())) return;

    setExporting(true);
    const operationId = newOperationId("copertine-export");
    const wasGuidesVisible = showGuides;
    setSelectedId(null);
    setShowGuides(false);

    try {
      // Attende il repaint prima della cattura.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 30)));

      const { default: html2canvas } = await import("html2canvas");
      // Attendi il caricamento completo dei font web prima del rendering HD.
      await document.fonts.ready;
      const node = canvasRef.current;
      if (!node) throw new Error("Canvas non disponibile");

      const canvas = await html2canvas(node, {
        scale: Math.max(2, EXPORT_DPI / 96),
        useCORS: true,
        backgroundColor: null,
      });

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!blob) throw new Error("Esportazione non riuscita");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `copertina-kdp-${trim}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);

      const result = await runtime.charge(operationId, "Esportazione copertina KDP completata");
      if (!result.ok) return;
      toast.success(result.duplicate ? "Esportazione completata" : "Esportazione completata — 1 credito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Esportazione non riuscita");
    } finally {
      setShowGuides(wasGuidesVisible);
      setExporting(false);
    }
  } finally {
      chargeGuard.current = false;
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* SIDEBAR CONTROLLI */}
      <div className="panel space-y-4 p-4">
        <Tabs defaultValue="kdp">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="kdp">KDP</TabsTrigger>
            <TabsTrigger value="front">Fronte</TabsTrigger>
            <TabsTrigger value="spine">Dorso</TabsTrigger>
            <TabsTrigger value="back">Retro</TabsTrigger>
            <TabsTrigger value="bg">Sfondo</TabsTrigger>
          </TabsList>

          <TabsContent value="kdp" className="space-y-3">
            <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Calcolatore Copertina KDP</h3>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Formato Libro (Trim Size)</Label>
                <Select value={trim} onValueChange={(v) => setTrim(v as TrimId)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KDP_TRIM_SIZES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">N. Pagine Totali</Label>
                  <Input
                    type="number"
                    min={24}
                    max={800}
                    value={pageCount}
                    onChange={(e) => setPageCount(Number(e.target.value) || 24)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Tipo Carta</Label>
                  <Select value={paperType} onValueChange={(v) => setPaperType(v as PaperType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KDP_PAPER_LABELS) as PaperType[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {KDP_PAPER_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1 rounded bg-background p-2 font-mono text-[10px] text-muted-foreground">
                <div>
                  Dorso Calcolato: <span className="font-bold text-accent">{spinePx300}px</span> ({spineInches.toFixed(4)}")
                </div>
                <div>
                  Telaio 300 DPI: <span className="text-foreground">{canvasWpx} x {canvasHpx} px</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-surface/60 p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Palette Sfondo (fallback)</h3>
              <Select value={palette} onValueChange={setPalette}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PALETTES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Usata quando non è caricata un'immagine di sfondo wrap-around.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="front" className="space-y-3">
            <TextFieldEditor title="Titolo Principale" value={title} onChange={setTitle} sizeMin={16} sizeMax={90} />

            <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Sottotitoli Dinamici</h3>
                <Button size="sm" variant="secondary" onClick={addSubtitle}>
                  + Aggiungi
                </Button>
              </div>
              {subtitles.map((s) => (
                <div key={s.id} className="space-y-2 rounded-lg border border-border p-2">
                  <TextFieldEditor
                    title="Sottotitolo"
                    value={s}
                    onChange={(next) => updateSubtitle(s.id, { ...next, id: s.id })}
                    sizeMin={8}
                    sizeMax={48}
                  />
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeSubtitle(s.id)}>
                    Rimuovi sottotitolo
                  </Button>
                </div>
              ))}
            </div>

            <TextFieldEditor title="Autore / Brand" value={author} onChange={setAuthor} sizeMin={8} sizeMax={42} />

            <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Livelli Immagine</h3>
                <span className="text-[10px] text-muted-foreground">{imageLayers.length} elementi</span>
              </div>
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-3 text-center transition hover:border-accent">
                <Upload className="mx-auto mb-1 size-4 text-accent" />
                <span className="block text-xs font-semibold">Carica Immagini (PNG/JPG)</span>
                <input
                  ref={imgFilesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageLayersUpload}
                />
              </label>
              {imageLayers.map((layer) => (
                <div key={layer.id} className="flex items-center gap-2 rounded border border-border p-2 text-xs">
                  <img src={layer.src} alt={layer.name} className="size-8 rounded object-cover" />
                  <span className="flex-1 truncate font-mono text-[11px]">{layer.name}</span>
                  <Slider
                    className="w-16"
                    min={50}
                    max={600}
                    value={[layer.width]}
                    onValueChange={([w]) => updateImageLayer(layer.id, { width: w ?? layer.width })}
                  />
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeImageLayer(layer.id)}>
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="spine" className="space-y-3">
            <TextFieldEditor title="Testo Dorso" value={spine} onChange={setSpine} sizeMin={6} sizeMax={24} />
          </TabsContent>

          <TabsContent value="back" className="space-y-3">
            <TextFieldEditor title="Sinossi Retro" value={backBlurb} onChange={setBackBlurb} sizeMin={8} sizeMax={24} multiline />
          </TabsContent>

          <TabsContent value="bg" className="space-y-3">
            <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent">Sfondo Copertina</h3>
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-4 text-center transition hover:border-accent">
                <Upload className="mx-auto mb-1 size-5 text-accent" />
                <span className="block text-xs font-semibold">Carica Sfondo Wrap-Around</span>
                <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              </label>
              {bgImage && (
                <div className="space-y-2 border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground">Larghezza (px)</Label>
                    <span className="font-mono text-[10px] text-accent">{Math.round(bgImage.width)}px</span>
                  </div>
                  <Slider
                    min={60}
                    max={3000}
                    value={[bgImage.width]}
                    onValueChange={([w]) => setBgImage((b) => (b ? { ...b, width: w ?? b.width } : b))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Offset X</Label>
                      <Input
                        type="number"
                        value={Math.round(bgImage.left)}
                        onChange={(e) => setBgImage((b) => (b ? { ...b, left: Number(e.target.value) || 0 } : b))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Offset Y</Label>
                      <Input
                        type="number"
                        value={Math.round(bgImage.top)}
                        onChange={(e) => setBgImage((b) => (b ? { ...b, top: Number(e.target.value) || 0 } : b))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setBgImage((b) => (b ? { ...b, width: previewW, top: 0, left: 0 } : b))}
                    >
                      Adatta Canvas
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-destructive" onClick={() => setBgImage(null)}>
                      Rimuovi
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Trascina lo sfondo sul canvas per spostarlo, usa la rotella per zoomare e la maniglia in basso a destra
                    per ridimensionarlo.
                  </p>
                </div>
              )}

            </div>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          Modifiche e anteprima non consumano crediti. Il credito viene scalato solo a esportazione completata.
        </p>
      </div>

      {/* AREA CANVAS */}
      <div className="space-y-4">
        <div className="panel flex flex-col items-center gap-3 p-6">
          <div className="flex w-full items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              KDP WRAP-AROUND • {trim} ({pageCount} pag., {KDP_PAPER_LABELS[paperType]}) • {canvasWpx}x{canvasHpx}px @ 300 DPI
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowGuides((v) => !v)}>
                <Ruler className="mr-1.5 size-3.5 text-accent" /> Guide KDP & Bleed
              </Button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="relative overflow-hidden border border-border shadow-2xl"
            style={{
              width: previewW,
              height: previewH,
              background: bgImage ? undefined : `linear-gradient(135deg, ${pal.from}, ${pal.to})`,
            }}
            onPointerDown={() => setSelectedId(null)}
          >
            {bgImage && (
              <DraggableBox
                top={bgImage.top}
                left={bgImage.left}
                width={bgImage.width}
                selected={selectedId === "bg"}
                onSelect={() => setSelectedId("bg")}
                onMove={(top, left) => setBgImage((b) => (b ? { ...b, top, left } : b))}
                onResize={(width) => setBgImage((b) => (b ? { ...b, width } : b))}
                className="z-0"
              >
                <img src={bgImage.src} alt="Sfondo copertina" className="pointer-events-none block h-auto w-full" />
              </DraggableBox>
            )}


            {/* Livelli immagine */}
            {imageLayers.map((layer) => (
              <DraggableBox
                key={layer.id}
                top={layer.top}
                left={layer.left}
                width={layer.width}
                selected={selectedId === layer.id}
                onSelect={() => setSelectedId(layer.id)}
                onMove={(top, left) => updateImageLayer(layer.id, { top, left })}
                className="z-10"
              >
                <img src={layer.src} alt={layer.name} className="pointer-events-none block w-full" />
              </DraggableBox>
            ))}

            {/* Guide KDP */}
            {showGuides && (
              <div className="pointer-events-none absolute inset-0 z-40">
                <div className="absolute border-2 border-dashed border-red-500/70" style={{ inset: bleedPx }} />
                <div className="absolute border border-dashed border-blue-500/50" style={{ inset: safeMarginPx }} />
                <div
                  className="absolute top-0 bottom-0 flex items-center justify-center border-x border-dashed border-red-500/70 bg-red-500/10"
                  style={{ left: frontWidthPx, width: spineWidthPx }}
                >
                  <span className="rotate-90 whitespace-nowrap font-mono text-[8px] font-bold uppercase tracking-widest text-rose-300">
                    Dorso KDP
                  </span>
                </div>
                <div className="absolute flex flex-col items-center justify-center border border-border bg-background/90 p-1 text-center" style={{ bottom: 20, left: 20, width: 120, height: 70 }}>
                  <span className="text-[7px] font-bold uppercase tracking-wide text-accent">Riserva Barcode KDP</span>
                </div>
              </div>
            )}

            {/* Retro */}
            <div className="absolute top-0 h-full z-10" style={{ left: 0, width: frontWidthPx }}>
              <DraggableBox
                top={backBlurb.top}
                left={backBlurb.left}
                width={frontWidthPx - 40}
                selected={selectedId === "back"}
                onSelect={() => setSelectedId("back")}
                onMove={(top, left) => setBackBlurb((v) => ({ ...v, top, left }))}
              >
                <p
                  className={`render-text leading-relaxed ${backBlurb.fx}`}
                  style={{ fontFamily: backBlurb.font, fontSize: backBlurb.size, whiteSpace: "pre-wrap", ...fxStyle(backBlurb.fx, backBlurb.color) }}
                >
                  {backBlurb.text}
                </p>
              </DraggableBox>
            </div>

            {/* Dorso */}
            <div className="absolute top-0 h-full z-10 flex items-center justify-center" style={{ left: frontWidthPx, width: spineWidthPx }}>
              <DraggableBox
                top={spine.top}
                left={spine.left}
                selected={selectedId === "spine"}
                onSelect={() => setSelectedId("spine")}
                onMove={(top, left) => setSpine((v) => ({ ...v, top, left }))}
              >
                <p
                  className={`render-text whitespace-nowrap font-bold uppercase tracking-widest ${spine.fx}`}
                  style={{
                    fontFamily: spine.font,
                    fontSize: spine.size,
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    ...fxStyle(spine.fx, spine.color),
                  }}
                >
                  {spine.text}
                </p>
              </DraggableBox>
            </div>

            {/* Fronte */}
            <div className="absolute top-0 h-full z-10" style={{ left: frontWidthPx + spineWidthPx, width: frontWidthPx }}>
              <DraggableBox
                top={title.top}
                left={title.left}
                width={frontWidthPx - 40}
                selected={selectedId === "title"}
                onSelect={() => setSelectedId("title")}
                onMove={(top, left) => setTitle((v) => ({ ...v, top, left }))}
              >
                <h1
                  className={`render-text text-center font-extrabold uppercase tracking-wide ${title.fx}`}
                  style={{ fontFamily: title.font, fontSize: title.size, ...fxStyle(title.fx, title.color) }}
                >
                  {title.text}
                </h1>
              </DraggableBox>

              {subtitles.map((s) => (
                <DraggableBox
                  key={s.id}
                  top={s.top}
                  left={s.left}
                  width={frontWidthPx - 40}
                  selected={selectedId === s.id}
                  onSelect={() => setSelectedId(s.id)}
                  onMove={(top, left) => updateSubtitle(s.id, { ...s, top, left })}
                >
                  <p
                    className={`render-text text-center font-semibold ${s.fx}`}
                    style={{ fontFamily: s.font, fontSize: s.size, ...fxStyle(s.fx, s.color) }}
                  >
                    {s.text}
                  </p>
                </DraggableBox>
              ))}

              <DraggableBox
                top={author.top}
                left={author.left}
                width={frontWidthPx - 40}
                selected={selectedId === "author"}
                onSelect={() => setSelectedId("author")}
                onMove={(top, left) => setAuthor((v) => ({ ...v, top, left }))}
              >
                <p
                  className={`render-text text-center text-xs font-bold uppercase tracking-widest ${author.fx}`}
                  style={{ fontFamily: author.font, fontSize: author.size, ...fxStyle(author.fx, author.color) }}
                >
                  {author.text}
                </p>
              </DraggableBox>
            </div>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting || runtime.charging}
          className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
        >
          {exporting || runtime.charging ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
          Esporta Stampa HD 300 DPI (1 credito)
        </Button>
      </div>
    </div>
  );
  }
