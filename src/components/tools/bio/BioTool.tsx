import { Copy, Download, Loader2, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";
import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { AiStyleControls } from "@/components/tools/ai/AiStyleControls";
import { DEFAULT_CREATIVITY, DEFAULT_TONE } from "@/components/tools/ai/aiStyle";
import { generateBioCopy } from "@/lib/aiCopy.functions";
import { extractCoverContent, extractPdfContent } from "@/components/tools/pdfContent";

import {
  type BioInput,
  type BioOutput,
  formatBioForExport,
  generateBioLocal,
} from "@/components/tools/bio/bioLogic";

/**
 * TOOL 7 — Bio Autore & Kit Stampa.
 * Genera bio autore (breve/media/lunga) e comunicato stampa di lancio, via AI
 * (multilingua) con fallback locale istantaneo se l'AI non è disponibile.
 * 1 credito per ogni generazione completata.
 */
export function BioTool({ runtime }: { runtime: ToolRuntime }) {
  const outputLocale = useOutputLanguage();
  const [input, setInput] = useState<Omit<BioInput, "tone">>({
    authorName: "",
    niche: "",
    achievements: "",
    personalTouch: "",
    bookTitle: "",
    releaseInfo: "",
    links: "",
  });
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [creativity, setCreativity] = useState(DEFAULT_CREATIVITY);
  const [useAi, setUseAi] = useState(true);
  const [aiUsed, setAiUsed] = useState(false);
  const [output, setOutput] = useState<BioOutput | null>(null);
  const [generating, setGenerating] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const chargeGuard = useRef(false);

  function update(patch: Partial<Omit<BioInput, "tone">>) {
    setInput((prev) => ({ ...prev, ...patch }));
  }

  function copyToClipboard(text: string, label: string) {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([formatBioForExport({ ...input, tone }, output)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bio-autore-${(input.authorName || "autore").toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleGenerate() {
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
      if (!input.authorName.trim() || !input.niche.trim()) {
        toast.error("Compila almeno nome autore e nicchia/genere di scrittura");
        return;
      }
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setGenerating(true);
      const operationId = newOperationId("bio-gen");
      try {
        const fullInput: BioInput = { ...input, tone };
        let result = generateBioLocal(fullInput);
        let usedAi = false;

        if (useAi) {
          try {
            const cover = coverFile ? await extractCoverContent(coverFile) : null;
            const interior = interiorFile
              ? await extractPdfContent(interiorFile, { maxImages: 2, maxTextPages: 4 })
              : null;
            const response = await generateBioCopy({
              data: {
                locale: outputLocale,
                authorName: input.authorName,
                niche: input.niche,
                achievements: input.achievements || undefined,
                personalTouch: input.personalTouch || undefined,
                tone,
                creativity,
                bookTitle: input.bookTitle || undefined,
                releaseInfo: input.releaseInfo || undefined,
                links: input.links || undefined,
                interiorText: interior?.text || undefined,
                interiorImages: interior?.images,
                coverImages: cover?.images,
              },
            });
            if (response.ok) {
              result = response.copy;
              usedAi = true;
            } else {
              toast.warning(`AI non disponibile: ${response.error}. Usato il motore interno.`);
            }
          } catch (aiError) {
            console.error(aiError);
            toast.warning("Generazione AI non riuscita: usato il motore interno.");
          }
        }

        const charge = await runtime.charge(operationId, "Generazione bio autore completata");
        if (!charge.ok) return;
        setOutput(result);
        setAiUsed(usedAi);
        toast.success(
          charge.duplicate ? "Generazione completata" : "Generazione completata — 1 credito",
        );
      } finally {
        setGenerating(false);
      }
    } finally {
      chargeGuard.current = false;
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="panel space-y-5 p-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Bio Autore & Kit Stampa
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Bio per Amazon Author Central, sito e social, più comunicato stampa per il lancio del
            libro.
          </p>
        </div>

        <OutputLanguageSelect id="bio-output-lang" />

        <div className="space-y-1.5">
          <Label htmlFor="bio-name">Nome autore</Label>
          <Input
            id="bio-name"
            value={input.authorName}
            onChange={(e) => update({ authorName: e.target.value })}
            placeholder="Es. Marco Bianchi"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio-niche">Nicchia / genere di scrittura</Label>
          <Input
            id="bio-niche"
            value={input.niche}
            onChange={(e) => update({ niche: e.target.value })}
            placeholder="Es. autrice di thriller psicologici, esperto di finanza personale..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio-achievements">Traguardi / credenziali (opzionale)</Label>
          <Textarea
            id="bio-achievements"
            rows={3}
            value={input.achievements}
            onChange={(e) => update({ achievements: e.target.value })}
            placeholder="Es. oltre 10.000 copie vendute, 3 libri pubblicati, collaborazioni con riviste di settore"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio-personal">Elementi personali (opzionale)</Label>
          <Textarea
            id="bio-personal"
            rows={2}
            value={input.personalTouch}
            onChange={(e) => update({ personalTouch: e.target.value })}
            placeholder="Es. vive a Bologna con due gatti e una collezione infinita di taccuini"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bio-book">Titolo libro da lanciare</Label>
            <Input
              id="bio-book"
              value={input.bookTitle}
              onChange={(e) => update({ bookTitle: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio-release">Data / info uscita (opzionale)</Label>
            <Input
              id="bio-release"
              value={input.releaseInfo}
              onChange={(e) => update({ releaseInfo: e.target.value })}
              placeholder="Es. 15 ottobre 2026"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio-links">Sito / social da citare (opzionale)</Label>
          <Input
            id="bio-links"
            value={input.links}
            onChange={(e) => update({ links: e.target.value })}
            placeholder="Es. www.marcobianchi.it — @marcobianchi.autore"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Copertina e/o interno del libro (opzionale)</Label>
          <p className="text-xs text-muted-foreground">
            Se li carichi, il comunicato stampa e la bio lunga citano dettagli reali del libro — non
            sono obbligatori: senza, il testo si basa comunque sui campi qui sopra.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label
              htmlFor="bio-cover-file"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-2 border-dashed border-border bg-surface p-3 text-center text-xs text-muted-foreground hover:border-accent"
            >
              <Upload className="size-4" />
              {coverFile ? coverFile.name : "Copertina (PDF o immagine)"}
              <input
                id="bio-cover-file"
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label
              htmlFor="bio-interior-file"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-2 border-dashed border-border bg-surface p-3 text-center text-xs text-muted-foreground hover:border-accent"
            >
              <Upload className="size-4" />
              {interiorFile ? interiorFile.name : "Interno (PDF)"}
              <input
                id="bio-interior-file"
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={(e) => setInteriorFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
          <div className="space-y-0.5">
            <Label htmlFor="bio-use-ai" className="text-sm">
              Genera con AI (consigliato)
            </Label>
            <p className="text-xs text-muted-foreground">
              Testi scritti su misura nella lingua scelta sopra. Se l'AI non è disponibile, viene
              usato automaticamente un motore interno di riserva (solo italiano).
            </p>
          </div>
          <Switch id="bio-use-ai" checked={useAi} onCheckedChange={setUseAi} />
        </div>

        <AiStyleControls
          idPrefix="bio-ai"
          tone={tone}
          onToneChange={setTone}
          creativity={creativity}
          onCreativityChange={setCreativity}
          disabled={!useAi}
        />

        <Button className="w-full" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          Genera — 1 credito
        </Button>
      </div>

      <div className="panel space-y-4 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Risultato
        </h3>

        {!output && (
          <p className="text-sm text-muted-foreground">
            Compila il form e premi "Genera" per ottenere 3 bio di lunghezza crescente e un
            comunicato stampa pronto.
          </p>
        )}

        {output && (
          <div className="space-y-5">
            <p className="text-[11px] text-muted-foreground">
              {aiUsed ? "Generato con AI." : "Generato con il motore interno (fallback)."}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Bio breve — social ({output.shortBio.length} caratteri)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.shortBio, "Bio breve")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea readOnly rows={2} className="text-sm" value={output.shortBio} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Bio media — Author Central ({output.mediumBio.length} caratteri)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.mediumBio, "Bio media")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea
                readOnly
                rows={4}
                className="text-sm leading-relaxed"
                value={output.mediumBio}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Bio lunga — sito/retro copertina ({output.longBio.length} caratteri)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.longBio, "Bio lunga")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea
                readOnly
                rows={6}
                className="text-sm leading-relaxed"
                value={output.longBio}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Comunicato stampa
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.pressRelease, "Comunicato stampa")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea
                readOnly
                rows={10}
                className="font-mono text-xs leading-relaxed"
                value={output.pressRelease}
              />
            </div>

            <Button variant="outline" className="w-full" onClick={downloadOutput}>
              <Download className="mr-2 size-4" /> Esporta kit completo (.txt)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
