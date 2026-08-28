import { Download, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { newOperationId } from "@/hooks/useAccount";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";

/**
 * TOOL 4 — Triage foto (modulo indipendente).
 * 1 credito solo dopo il download completato delle 3 cartelle.
 */

type Bucket = "approvate" | "da_migliorare" | "scartate";

interface Analyzed {
  file: File;
  width: number;
  height: number;
  megapixel: number;
  bucket: Bucket;
  note: string;
}

const BUCKET_LABEL: Record<Bucket, string> = {
  approvate: "Approvate",
  da_migliorare: "Da migliorare",
  scartate: "Scartate",
};

export function TriageTool({ runtime }: { runtime: ToolRuntime }) {
  const [items, setItems] = useState<Analyzed[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAnalyzing(true);
    try {
      const analyzed: Analyzed[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        analyzed.push(await analyzeImage(file));
      }
      setItems(analyzed);
      toast.success(`${analyzed.length} immagini analizzate (gratuito)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Analisi non riuscita");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDownload() {
    if (items.length === 0) return;
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    setDownloading(true);
    const operationId = newOperationId("triage-download");

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const folders: Record<Bucket, ReturnType<JSZip["folder"]>> = {
        approvate: zip.folder("01_approvate"),
        da_migliorare: zip.folder("02_da_migliorare"),
        scartate: zip.folder("03_scartate"),
      };

      for (const item of items) {
        folders[item.bucket]?.file(item.file.name, await item.file.arrayBuffer());
      }
      zip.file("report.txt", buildReport(items));

      const blob = await zip.generateAsync({ type: "blob" });

      // Download completato → solo ora consumiamo il credito.
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "triage-foto.zip";
      link.click();
      URL.revokeObjectURL(url);

      const result = await runtime.charge(operationId, "Download completato delle 3 cartelle");
      if (!result.ok) return;
      toast.success(result.duplicate ? "Download completato" : "Download completato — 1 credito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download non riuscito");
    } finally {
      setDownloading(false);
    }
  }

  const counts = items.reduce<Record<Bucket, number>>(
    (acc, item) => ({ ...acc, [item.bucket]: acc[item.bucket] + 1 }),
    { approvate: 0, da_migliorare: 0, scartate: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="panel space-y-4 p-6">
        <Label htmlFor="triage-files">Carica le immagini</Label>
        <input
          id="triage-files"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
          className="block w-full cursor-pointer rounded-lg border border-dashed border-border bg-surface p-6 text-sm text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">
          L'analisi è gratuita. Il credito viene scalato solo al download completato delle 3 cartelle.
        </p>
        {analyzing && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Analisi in corso…
          </p>
        )}
      </div>

      {items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.keys(BUCKET_LABEL) as Bucket[]).map((bucket) => (
              <div key={bucket} className="panel p-5">
                <p className="text-xs tracking-wide uppercase text-muted-foreground">
                  {BUCKET_LABEL[bucket]}
                </p>
                <p className="mt-2 text-2xl font-black">{counts[bucket]}</p>
              </div>
            ))}
          </div>

          <div className="panel divide-y divide-border">
            {items.map((item) => (
              <div key={item.file.name} className="flex items-center gap-3 p-4 text-sm">
                <Upload className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{item.file.name}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {item.width}×{item.height} · {item.megapixel.toFixed(1)} MP
                </span>
                <Badge
                  variant="outline"
                  className={
                    item.bucket === "approvate"
                      ? "border-accent/40 text-accent"
                      : item.bucket === "scartate"
                        ? "border-destructive/40 text-destructive"
                        : "border-border text-muted-foreground"
                  }
                >
                  {BUCKET_LABEL[item.bucket]}
                </Badge>
              </div>
            ))}
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
            Scarica le 3 cartelle (1 credito)
          </Button>
        </>
      )}
    </div>
  );
}

function buildReport(items: Analyzed[]) {
  return items
    .map((i) => `${i.file.name}\t${i.width}x${i.height}\t${i.megapixel.toFixed(1)}MP\t${i.bucket}\t${i.note}`)
    .join("\n");
}

async function analyzeImage(file: File): Promise<Analyzed> {
  const url = URL.createObjectURL(file);
  try {
    const { width, height } = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error(`Immagine non leggibile: ${file.name}`));
        img.src = url;
      },
    );

    const megapixel = (width * height) / 1_000_000;
    const minSide = Math.min(width, height);

    let bucket: Bucket = "approvate";
    let note = "Risoluzione adeguata per la stampa KDP";
    if (minSide < 900 || megapixel < 1.2) {
      bucket = "scartate";
      note = "Risoluzione troppo bassa per la stampa";
    } else if (minSide < 1600 || megapixel < 3) {
      bucket = "da_migliorare";
      note = "Utilizzabile solo in formato ridotto";
    }

    return { file, width, height, megapixel, bucket, note };
  } finally {
    URL.revokeObjectURL(url);
  }
}
