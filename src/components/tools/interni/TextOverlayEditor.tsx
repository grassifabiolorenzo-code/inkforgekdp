import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  DEFAULT_TEXT_OVERLAY,
  drawPageWithTextOverlay,
  type TextOverlayState,
} from "./textOverlay";
import type { InteriorPage } from "./types";

const PREVIEW_MAX_W = 320;
const PREVIEW_MAX_H = 420;

/**
 * Piccolo editor canvas — nello spirito del tool Copertine, ma volutamente minimale — per
 * scrivere un testo libero su una pagina template (già sbloccata) o sulla pagina bianca. Il
 * canvas qui è solo per l'anteprima interattiva (clic per posizionare il testo): il file finale
 * viene renderizzato a risoluzione di stampa dal chiamante, solo dopo l'addebito del credito.
 */
export function TextOverlayEditor({
  open,
  onOpenChange,
  page,
  trimWidthIn,
  trimHeightIn,
  mirrored,
  applying,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: InteriorPage;
  trimWidthIn: number;
  trimHeightIn: number;
  mirrored: boolean;
  applying: boolean;
  onApply: (overlay: TextOverlayState) => void;
}) {
  const [overlay, setOverlay] = useState<TextOverlayState>(DEFAULT_TEXT_OVERLAY);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ripartire da uno stato pulito ogni volta che si apre l'editor su una pagina.
  useEffect(() => {
    if (open) setOverlay(DEFAULT_TEXT_OVERLAY);
  }, [open, page.id]);

  const aspect = trimWidthIn / trimHeightIn;
  const previewW = aspect >= PREVIEW_MAX_W / PREVIEW_MAX_H ? PREVIEW_MAX_W : PREVIEW_MAX_H * aspect;
  const previewH = aspect >= PREVIEW_MAX_W / PREVIEW_MAX_H ? PREVIEW_MAX_W / aspect : PREVIEW_MAX_H;

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.round(previewW);
    canvas.height = Math.round(previewH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawPageWithTextOverlay(ctx, canvas.width, canvas.height, page, overlay, mirrored);
  }, [open, page, overlay, mirrored, previewW, previewH]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xFrac = (e.clientX - rect.left) / rect.width;
    const yFrac = (e.clientY - rect.top) / rect.height;
    setOverlay((prev) => ({
      ...prev,
      xFrac: Math.min(1, Math.max(0, xFrac)),
      yFrac: Math.min(1, Math.max(0, yFrac)),
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Scrivi sulla pagina</DialogTitle>
          <DialogDescription>
            Clicca sull&apos;anteprima per posizionare il testo. Applicare il testo trasforma questa
            pagina in un&apos;immagine e costa 1 credito.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center overflow-hidden rounded-md border border-border bg-white p-2">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-crosshair"
            style={{ width: previewW, height: previewH }}
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="text-overlay-content">Testo</Label>
            <Textarea
              id="text-overlay-content"
              rows={2}
              value={overlay.text}
              onChange={(e) => setOverlay((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="Scrivi qui il testo da aggiungere alla pagina..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dimensione testo</Label>
              <Slider
                aria-label="Dimensione testo"
                min={2}
                max={14}
                step={0.5}
                value={[overlay.fontSize * 100]}
                onValueChange={(v) =>
                  setOverlay((prev) => ({ ...prev, fontSize: (v[0] ?? 5) / 100 }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="text-overlay-color">Colore</Label>
              <Input
                id="text-overlay-color"
                type="color"
                value={overlay.color}
                onChange={(e) => setOverlay((prev) => ({ ...prev, color: e.target.value }))}
                className="h-9 w-full p-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Allineamento</Label>
            <div className="flex gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <Button
                  key={align}
                  type="button"
                  size="sm"
                  variant={overlay.align === align ? "default" : "outline"}
                  className={cn("flex-1")}
                  onClick={() => setOverlay((prev) => ({ ...prev, align }))}
                >
                  {align === "left" ? "Sinistra" : align === "center" ? "Centro" : "Destra"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            type="button"
            onClick={() => onApply(overlay)}
            disabled={!overlay.text.trim() || applying}
          >
            {applying && <Loader2 className="mr-2 size-4 animate-spin" />}
            Applica (1 credito)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
