import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
import { AGES, NICHES } from "@/components/tools/aplus/constants";
import { generateModulesText } from "@/components/tools/aplus/copyEngine";
import { drawHero } from "@/components/tools/aplus/canvasRenderers";
import type { AgeId, NicheId } from "@/components/tools/aplus/types";
import { applyPreviewWatermark } from "@/components/landing/demo/watermark";

const NICHE_COLORS: Record<NicheId, [string, string]> = {
  music: ["#312e81", "#6366f1"],
  planner: ["#164e63", "#0ea5e9"],
  coloring: ["#7c2d12", "#f97316"],
  generic: ["#1e293b", "#64748b"],
};

const HERO_VISIBLE_CHARS = 90;

/** Genera una copertina segnaposto (nessun upload richiesto) per popolare il mockup Hero. */
function buildPlaceholderCover(title: string, niche: NicheId): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;
  const [c1, c2] = NICHE_COLORS[niche];
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(1, c2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 36px sans-serif";
  ctx.textAlign = "center";
  const words = (title || "Il Mio Libro").toUpperCase().split(" ");
  let line = "";
  let y = canvas.height / 2 - 20;
  const lines: string[] = [];
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > canvas.width - 60 && line) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  y -= (lines.length - 1) * 22;
  for (const l of lines) {
    ctx.fillText(l, canvas.width / 2, y);
    y += 44;
  }
  return canvas;
}

/**
 * Anteprima gratuita, senza login, del tool A+ KDPstudio: mostra il mockup del Modulo 1 (Hero
 * Banner) con una copertina segnaposto (o caricata al volo) e il testo generato dal motore
 * locale. Filigrana permanente sull'immagine, testo dell'headline troncato: gli altri 4 moduli e
 * l'export completo restano riservati agli abbonati.
 */
export function APlusPreviewDemo() {
  const [title, setTitle] = useState("Dinosauri da Colorare");
  const [niche, setNiche] = useState<NicheId>("coloring");
  const [age, setAge] = useState<AgeId>("4-6");
  const [uploadedCover, setUploadedCover] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const texts = generateModulesText({
    lang: "it",
    niche,
    age,
    pages: [1, 2, 3],
    variationIndex: 0,
  });
  const heroHeading = texts.hero.heading;
  const heroBody = texts.hero.body;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 970;
    canvas.height = 300;
    const cover = uploadedCover ?? buildPlaceholderCover(title, niche);
    drawHero(canvas, cover, cover, "#f8fafc", null);
    applyPreviewWatermark(canvas, "ANTEPRIMA — INKFORGEKDP.COM");
  }, [title, niche, uploadedCover]);

  function handleUpload(file: File | null) {
    if (!file) {
      setUploadedCover(null);
      return;
    }
    const img = new Image();
    img.onload = () => setUploadedCover(img);
    img.src = URL.createObjectURL(file);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-start">
      <div className="space-y-4">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-accent" /> Tool 3 — A+ KDPstudio
        </p>
        <h3 className="text-2xl font-bold">
          Il tuo <span className="text-gradient">banner A+</span> senza aprire un editor grafico
        </h3>
        <p className="text-sm text-muted-foreground">
          Nell'app il mockup usa la copertina e le pagine interne reali del tuo PDF, e i testi
          vengono scritti analizzandole davvero. Qui sotto una copertina segnaposto (o carica la
          tua) per vedere subito il Modulo 1 — Hero Banner, 970×300 px.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="aplus-demo-title">Titolo del libro</Label>
          <Input id="aplus-demo-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="aplus-demo-niche">Nicchia</Label>
            <Select value={niche} onValueChange={(v) => setNiche(v as NicheId)}>
              <SelectTrigger id="aplus-demo-niche">
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
          <div className="space-y-1.5">
            <Label htmlFor="aplus-demo-age">Età target</Label>
            <Select value={age} onValueChange={(v) => setAge(v as AgeId)}>
              <SelectTrigger id="aplus-demo-age">
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
        </div>

        <label
          htmlFor="aplus-demo-cover-upload"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-surface px-3 py-2 text-xs text-muted-foreground hover:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
        >
          <Upload className="size-3.5 shrink-0" />
          {uploadedCover
            ? "Copertina caricata — clicca per cambiarla"
            : "Oppure carica una tua immagine di copertina"}
          <input
            id="aplus-demo-cover-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            ref={fileInputRef}
            onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          />
        </label>

        <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          <Link to="/pricing">
            <Lock className="mr-2 size-4" /> Sblocca tutti e 5 i moduli senza filigrana
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-border bg-black/60 p-3">
          <canvas ref={canvasRef} className="h-auto w-full rounded-md object-contain" />
        </div>
        <div className="panel space-y-2 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Testo Modulo 1 (Hero)
          </p>
          <p className="text-sm font-semibold">{heroHeading}</p>
          <div className="relative">
            <p className="text-sm text-muted-foreground">
              {heroBody.slice(0, HERO_VISIBLE_CHARS)}
              <span aria-hidden className="select-none blur-[3px]">
                {heroBody.slice(HERO_VISIBLE_CHARS, HERO_VISIBLE_CHARS + 120)}
              </span>
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="size-3 shrink-0" />
            Moduli 2-5 (Proof, Value, Griglia, Compare) generati e disponibili con un abbonamento
            attivo.
          </p>
        </div>
      </div>
    </div>
  );
}
