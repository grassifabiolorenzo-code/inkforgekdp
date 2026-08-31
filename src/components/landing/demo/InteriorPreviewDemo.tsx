import { Link } from "@tanstack/react-router";
import { Lock, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEMPLATE_LIBRARY, drawTemplate, type TemplateId } from "@/components/tools/interni/templateLibrary";
import { applyPreviewWatermark } from "@/components/landing/demo/watermark";

const CATEGORIES = [...new Set(TEMPLATE_LIBRARY.map((t) => t.category))];
const PREVIEW_W = 850;
const PREVIEW_H = 1100;

/**
 * Anteprima gratuita, senza login, del tool Interni: mostra la pagina generata al volo con una
 * filigrana permanente. Nessun download reale è possibile: il pulsante porta ai piani.
 */
export function InteriorPreviewDemo() {
  const [templateId, setTemplateId] = useState<TemplateId>(TEMPLATE_LIBRARY[0]!.id);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = PREVIEW_W;
    canvas.height = PREVIEW_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
    drawTemplate(ctx, templateId, PREVIEW_W, PREVIEW_H);
    applyPreviewWatermark(canvas);
  }, [templateId]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-center">
      <div className="space-y-4">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Timer className="size-3.5 text-accent" /> Tool 5 — Interni
        </p>
        <h3 className="text-2xl font-bold">
          Una pagina pronta per il tuo libro in <span className="text-gradient">meno di 10 secondi</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          Niente InDesign, niente Canva: scegli un tipo di pagina dalla libreria e la vedi generata subito, già nel
          formato giusto per KDP. Nell'app puoi caricarne quante vuoi, riordinarle e scaricare il PDF interno
          completo.
        </p>
        <div className="space-y-1.5">
          <Select value={templateId} onValueChange={(v) => setTemplateId(v as TemplateId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
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
        </div>
        <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          <Link to="/pricing">
            <Lock className="mr-2 size-4" /> Sblocca il download senza filigrana
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-black/60 p-3">
        <canvas ref={canvasRef} className="h-auto w-full rounded-md object-contain" />
      </div>
    </div>
  );
}
