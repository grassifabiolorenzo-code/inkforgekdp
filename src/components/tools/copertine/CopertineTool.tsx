import { useEffect, useRef, useState } from "react";
import { Loader2, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { newOperationId } from "@/hooks/useAccount";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { BookProjectPicker } from "@/components/tools/BookProjectPicker";
import { useBookProject } from "@/hooks/useBookProject";

const STUDIO_URL = "/tools/copertine-studio.html";

function dataUrlToFile(dataUrl: string, filename: string): File | null {
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, mime, base64] = match;
  const bytes = atob(base64!);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new File([buffer], filename, { type: mime ?? "image/png" });
}

/**
 * Copertine: lo studio KDP completo viene servito come applicazione autonoma
 * (public/tools/copertine-studio.html) ed è integrato qui in un frame isolato.
 * Il contratto crediti resta lato piattaforma: lo studio chiede il permesso
 * prima di rasterizzare e poi chiede conferma dell'addebito reale subito dopo
 * la rasterizzazione; il download parte solo se l'addebito va a buon fine.
 */
export function CopertineTool({ runtime }: { runtime: ToolRuntime }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const chargeGuard = useRef(false);
  const [loading, setLoading] = useState(true);
  const [exportedCover, setExportedCover] = useState<File | null>(null);
  const bookProject = useBookProject();

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      const data = event.data as {
        source?: string;
        type?: string;
        id?: string;
        dataUrl?: string;
      } | null;
      if (!data || data.source !== "op-copertine") return;

      if (data.type === "export-complete") {
        if (data.dataUrl) {
          const file = dataUrlToFile(data.dataUrl, `copertina-${Date.now()}.png`);
          if (file) setExportedCover(file);
        }
        return;
      }

      const frameWindow = frameRef.current?.contentWindow;
      if (!frameWindow) return;

      if (data.type === "export-request") {
        let allowed = false;
        if (!runtime.canOperate) {
          runtime.blockOperation();
        } else {
          allowed = await runtime.ensureAccess();
        }
        frameWindow.postMessage({ source: "op-host", id: data.id, allowed }, "*");
        return;
      }

      if (data.type === "charge-request") {
        // Addebito confermato PRIMA che lo studio avvii il download: se fallisce,
        // lo studio annulla l'esportazione e nessun file viene consegnato.
        if (chargeGuard.current) return;
        chargeGuard.current = true;
        let charged = false;
        try {
          const result = await runtime.charge(
            newOperationId("copertine-export-png"),
            "Export copertina KDP HD",
          );
          charged = result.ok;
        } finally {
          chargeGuard.current = false;
        }
        frameWindow.postMessage({ source: "op-host", id: data.id, charged }, "*");
        return;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [runtime]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Studio copertine KDP completo: specifiche, dorso calcolato, guide bleed, livelli immagine,
          tipografia e export stampa 300 DPI.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void frameRef.current?.requestFullscreen()}
        >
          <Maximize2 className="mr-2 size-4" />
          Schermo intero
        </Button>
      </div>

      <BookProjectPicker
        bookProject={bookProject}
        onFilesLoaded={() => {
          // Copertine è un editor da zero: selezionare un progetto qui serve solo a
          // scegliere dove salvare la PROSSIMA esportazione, non carica nulla nell'editor.
        }}
        currentCoverFile={exportedCover}
        currentInteriorFile={null}
      />

      <div className="relative overflow-hidden rounded-xl border border-border bg-background">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          ref={frameRef}
          src={STUDIO_URL}
          title="Studio Copertine KDP"
          onLoad={() => setLoading(false)}
          className="h-[80vh] min-h-[680px] w-full border-0"
        />
      </div>

      {runtime.charging && (
        <p className="text-xs text-muted-foreground">Registrazione utilizzo in corso…</p>
      )}
    </div>
  );
}
