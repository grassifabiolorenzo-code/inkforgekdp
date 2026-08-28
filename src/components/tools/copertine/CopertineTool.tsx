import { Download, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { newOperationId } from "@/hooks/useAccount";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";

/**
 * TOOL 1 — Copertine (modulo indipendente).
 * Il credito viene consumato SOLO dopo un'esportazione immagine completata.
 */

const TRIM_SIZES = [
  { id: "6x9", label: '6" x 9"', w: 6, h: 9 },
  { id: "5x8", label: '5" x 8"', w: 5, h: 8 },
  { id: "8.5x11", label: '8.5" x 11"', w: 8.5, h: 11 },
];

const PALETTES = [
  { id: "violet", label: "Violet Studio", from: "#7c3aed", to: "#22c55e" },
  { id: "midnight", label: "Midnight", from: "#0f172a", to: "#4338ca" },
  { id: "amber", label: "Amber Press", from: "#111827", to: "#f59e0b" },
];

export function CopertineTool({ runtime }: { runtime: ToolRuntime }) {
  const [title, setTitle] = useState("Il tuo titolo");
  const [subtitle, setSubtitle] = useState("Sottotitolo del libro");
  const [author, setAuthor] = useState("Nome Autore");
  const [trim, setTrim] = useState(TRIM_SIZES[0]!.id);
  const [palette, setPalette] = useState(PALETTES[0]!.id);
  const [titleSize, setTitleSize] = useState([64]);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const size = TRIM_SIZES.find((t) => t.id === trim)!;
  const pal = PALETTES.find((p) => p.id === palette)!;
  const previewRatio = size.w / size.h;

  async function handleExport() {
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    // Verifica server-side del piano e dei crediti.
    if (!(await runtime.ensureAccess())) return;
    setExporting(true);
    const operationId = newOperationId("copertine-export");

    try {
      // 1. Render dell'immagine finale (300 DPI).
      const dpi = 300;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = size.w * dpi;
      canvas.height = size.h * dpi;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas non disponibile");

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, pal.from);
      gradient.addColorStop(1, pal.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, canvas.height * 0.42, canvas.width, canvas.height * 0.3);

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      const scale = dpi / 96;
      ctx.font = `800 ${titleSize[0]! * scale * 1.6}px Inter, sans-serif`;
      wrapText(ctx, title, canvas.width / 2, canvas.height * 0.5, canvas.width * 0.8, titleSize[0]! * scale * 1.8);

      ctx.font = `400 ${28 * scale}px Inter, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.66);

      ctx.font = `600 ${32 * scale}px Inter, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(author.toUpperCase(), canvas.width / 2, canvas.height * 0.9);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png"),
      );
      if (!blob) throw new Error("Esportazione non riuscita");

      // 2. Download effettivo.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `copertina-${size.id}.png`;
      link.click();
      URL.revokeObjectURL(url);

      // 3. Solo ora consumiamo il credito.
      const result = await runtime.charge(operationId, "Esportazione immagine completata");
      if (!result.ok) return;
      toast.success(
        result.duplicate ? "Esportazione completata" : "Esportazione completata — 1 credito",
      );
    } catch (error) {
      // Nessun credito consumato in caso di errore.
      toast.error(error instanceof Error ? error.message : "Esportazione non riuscita");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="panel space-y-5 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Impostazioni copertina
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="cover-title">Titolo</Label>
          <Input id="cover-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cover-subtitle">Sottotitolo</Label>
          <Input id="cover-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cover-author">Autore</Label>
          <Input id="cover-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Formato KDP</Label>
            <Select value={trim} onValueChange={setTrim}>
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
          <div className="space-y-1.5">
            <Label>Palette</Label>
            <Select value={palette} onValueChange={setPalette}>
              <SelectTrigger>
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
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dimensione titolo ({titleSize[0]}px)</Label>
          <Slider min={32} max={96} step={2} value={titleSize} onValueChange={setTitleSize} />
        </div>

        <p className="text-xs text-muted-foreground">
          Modifiche e anteprima non consumano crediti. Il credito viene scalato solo a esportazione
          completata.
        </p>
      </div>

      <div className="space-y-4">
        <div className="panel p-6">
          <p className="mb-4 text-xs tracking-wide uppercase text-muted-foreground">
            Anteprima — gratuita
          </p>
          <div
            className="mx-auto flex max-w-xs flex-col items-center justify-center rounded-lg p-8 text-center shadow-xl"
            style={{
              aspectRatio: String(previewRatio),
              background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`,
            }}
          >
            <p
              className="font-black leading-tight text-white"
              style={{ fontSize: `${Math.max(titleSize[0]! / 2.6, 14)}px` }}
            >
              {title}
            </p>
            <p className="mt-3 text-xs text-white/85">{subtitle}</p>
            <p className="mt-auto pt-8 text-[11px] font-semibold tracking-widest text-white">
              {author.toUpperCase()}
            </p>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={exporting || runtime.charging}
          className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
        >
          {exporting || runtime.charging ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Esporta immagine (1 credito)
        </Button>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
