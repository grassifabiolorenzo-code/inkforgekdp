import { Copy, Download, Loader2, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";
import { useBookProject } from "@/hooks/useBookProject";
import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { AiStyleControls } from "@/components/tools/ai/AiStyleControls";
import { BookProjectPicker } from "@/components/tools/BookProjectPicker";
import { GenerationHistoryPanel } from "@/components/tools/GenerationHistoryPanel";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { DEFAULT_CREATIVITY, DEFAULT_TONE } from "@/components/tools/ai/aiStyle";
import { generatePromoCopy } from "@/lib/aiCopy.functions";
import { extractCoverContent, extractPdfContent } from "@/components/tools/pdfContent";

import {
  PLATFORMS,
  type PromoInput,
  type PromoOutput,
  type PromoPlatform,
  formatPromoKitForExport,
  generatePromoKitLocal,
} from "@/components/tools/promo/promoLogic";

/**
 * TOOL 8 — Social & Ads Promo Kit.
 * Genera post social multi-piattaforma, headline/bullet Amazon Ads ed email
 * di lancio, via AI (multilingua) con fallback locale istantaneo se l'AI non
 * è disponibile. 1 credito per ogni generazione completata.
 */
export function PromoTool({ runtime }: { runtime: ToolRuntime }) {
  const outputLocale = useOutputLanguage();
  const bookProject = useBookProject();
  const history = useGenerationHistory<PromoInput, PromoOutput>("promo");
  const [input, setInput] = useState<Omit<PromoInput, "tone">>({
    bookTitle: "",
    genre: "",
    usp: "",
    audience: "",
    cta: "",
    platforms: ["instagram", "facebook"],
  });
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [creativity, setCreativity] = useState(DEFAULT_CREATIVITY);
  const [useAi, setUseAi] = useState(true);
  const [aiUsed, setAiUsed] = useState(false);
  const [output, setOutput] = useState<PromoOutput | null>(null);
  const [generating, setGenerating] = useState(false);
  const [restoredFromHistory, setRestoredFromHistory] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const chargeGuard = useRef(false);

  function update(patch: Partial<Omit<PromoInput, "tone">>) {
    setInput((prev) => ({ ...prev, ...patch }));
  }

  function togglePlatform(platform: PromoPlatform, checked: boolean) {
    setInput((prev) => ({
      ...prev,
      platforms: checked
        ? [...prev.platforms, platform]
        : prev.platforms.filter((p) => p !== platform),
    }));
  }

  function copyToClipboard(text: string, label: string) {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([formatPromoKitForExport({ ...input, tone }, output)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-kit-${(input.bookTitle || "libro").toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleGenerate() {
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
      if (!input.bookTitle.trim() || !input.usp.trim()) {
        toast.error("Compila almeno titolo del libro e punto di forza principale");
        return;
      }
      if (input.platforms.length === 0) {
        toast.error("Seleziona almeno una piattaforma social");
        return;
      }
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setGenerating(true);
      const operationId = newOperationId("promo-gen");
      try {
        const fullInput: PromoInput = { ...input, tone };
        let result = generatePromoKitLocal(fullInput, outputLocale);
        let usedAi = false;

        if (useAi) {
          try {
            const cover = coverFile ? await extractCoverContent(coverFile) : null;
            const interior = interiorFile
              ? await extractPdfContent(interiorFile, { maxImages: 2, maxTextPages: 4 })
              : null;
            const response = await generatePromoCopy({
              data: {
                locale: outputLocale,
                bookTitle: input.bookTitle,
                genre: input.genre || undefined,
                usp: input.usp,
                audience: input.audience,
                cta: input.cta || undefined,
                platforms: input.platforms,
                tone,
                creativity,
                interiorText: interior?.text || undefined,
                interiorImages: interior?.images,
                coverImages: cover?.images,
              },
            });
            if (response.ok) {
              const validPlatforms = new Set(PLATFORMS.map((p) => p.id));
              const posts = response.copy.posts
                .filter((p) => validPlatforms.has(p.platform as PromoPlatform))
                .map((p) => ({ platform: p.platform as PromoPlatform, caption: p.caption }));
              if (posts.length === 0 && response.copy.posts.length > 0) {
                // L'AI ha risposto ma con piattaforme non riconosciute: senza questo avviso
                // l'utente vedrebbe post generici del motore interno senza sapere perché non
                // riflettono le piattaforme scelte.
                toast.warning(
                  "L'AI ha restituito piattaforme non riconosciute: post social sostituiti con il motore interno.",
                );
              }
              result = {
                posts: posts.length > 0 ? posts : result.posts,
                adsHeadlines:
                  response.copy.adsHeadlines.length > 0
                    ? response.copy.adsHeadlines
                    : result.adsHeadlines,
                adsBullets:
                  response.copy.adsBullets.length > 0
                    ? response.copy.adsBullets
                    : result.adsBullets,
                launchEmail: response.copy.launchEmail || result.launchEmail,
              };
              usedAi = true;
            } else {
              toast.warning(
                `AI non disponibile: ${response.error}. Usato il motore interno di riserva.`,
              );
            }
          } catch (aiError) {
            console.error(aiError);
            toast.warning("Generazione AI non riuscita: usato il motore interno di riserva.");
          }
        }

        const charge = await runtime.charge(operationId, "Generazione promo kit completata");
        if (!charge.ok) return;
        setOutput(result);
        setAiUsed(usedAi);
        setRestoredFromHistory(false);
        toast.success(
          charge.duplicate ? "Generazione completata" : "Generazione completata — 1 credito",
        );
        history
          .saveEntry({
            title: input.bookTitle || "Senza titolo",
            locale: outputLocale,
            input: fullInput,
            output: result,
          })
          .catch((err) => console.error("Salvataggio cronologia non riuscito", err));
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
            Social & Ads Promo Kit
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Post social multi-piattaforma, headline/bullet Amazon Ads ed email di lancio in un
            click.
          </p>
        </div>

        <OutputLanguageSelect id="pr-output-lang" />

        <div className="space-y-1.5">
          <Label htmlFor="pr-title">Titolo del libro</Label>
          <Input
            id="pr-title"
            value={input.bookTitle}
            onChange={(e) => update({ bookTitle: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-genre">Genere (per hashtag, opzionale)</Label>
          <Input
            id="pr-genre"
            value={input.genre}
            onChange={(e) => update({ genre: e.target.value })}
            placeholder="Es. thriller, self-help, fantasy..."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-usp">Punto di forza principale</Label>
          <Textarea
            id="pr-usp"
            rows={3}
            value={input.usp}
            onChange={(e) => update({ usp: e.target.value })}
            placeholder="Es. una storia di redenzione ambientata in una Napoli mai raccontata prima"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-audience">Target / pubblico ideale</Label>
          <Input
            id="pr-audience"
            value={input.audience}
            onChange={(e) => update({ audience: e.target.value })}
            placeholder="Es. lettori di narrativa contemporanea"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-cta">Call to action (opzionale)</Label>
          <Input
            id="pr-cta"
            value={input.cta}
            onChange={(e) => update({ cta: e.target.value })}
            placeholder="Es. Disponibile ora su Amazon in cartaceo ed eBook."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs tracking-wide uppercase text-muted-foreground">
            Piattaforme social
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-sm"
              >
                <Checkbox
                  checked={input.platforms.includes(p.id)}
                  onCheckedChange={(checked) => togglePlatform(p.id, checked === true)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Progetto libro (opzionale)</Label>
          <p className="text-xs text-muted-foreground">
            Riusa copertina/interno già caricati in un altro tool, o carica nuovi file qui sotto.
          </p>
          <BookProjectPicker
            bookProject={bookProject}
            currentCoverFile={coverFile}
            currentInteriorFile={interiorFile}
            onFilesLoaded={({ cover, interior }) => {
              setCoverFile(cover);
              setInteriorFile(interior);
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Copertina e/o interno del libro (opzionale)</Label>
          <p className="text-xs text-muted-foreground">
            Se li carichi, post e email di lancio citano dettagli reali del libro invece di restare
            generici — non sono obbligatori: senza, il testo si basa comunque sui campi qui sopra.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label
              htmlFor="pr-cover-file"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-2 border-dashed border-border bg-surface p-3 text-center text-xs text-muted-foreground hover:border-accent"
            >
              <Upload className="size-4" />
              {coverFile ? coverFile.name : "Copertina (PDF o immagine)"}
              <input
                id="pr-cover-file"
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <label
              htmlFor="pr-interior-file"
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-2 border-dashed border-border bg-surface p-3 text-center text-xs text-muted-foreground hover:border-accent"
            >
              <Upload className="size-4" />
              {interiorFile ? interiorFile.name : "Interno (PDF)"}
              <input
                id="pr-interior-file"
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
            <Label htmlFor="pr-use-ai" className="text-sm">
              Genera con AI (consigliato)
            </Label>
            <p className="text-xs text-muted-foreground">
              Testi scritti su misura nella lingua scelta sopra. Se l'AI non è disponibile, viene
              usato automaticamente un motore interno di riserva, anch'esso nella lingua scelta.
            </p>
          </div>
          <Switch id="pr-use-ai" checked={useAi} onCheckedChange={setUseAi} />
        </div>

        <AiStyleControls
          idPrefix="pr-ai"
          tone={tone}
          onToneChange={setTone}
          creativity={creativity}
          onCreativityChange={setCreativity}
          disabled={!useAi}
        />

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || runtime.charging}
        >
          {generating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          Genera — 1 credito
        </Button>
      </div>

      <div className="panel space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Risultato
          </h3>
          <GenerationHistoryPanel
            history={history}
            onRestore={(savedInput, savedOutput) => {
              const { tone: savedTone, ...rest } = savedInput;
              setInput(rest);
              setTone(savedTone);
              setOutput(savedOutput);
              setRestoredFromHistory(true);
            }}
          />
        </div>

        {!output && (
          <p className="text-sm text-muted-foreground">
            Compila il form e premi "Genera" per ottenere post social, ads Amazon ed email di lancio
            pronti da usare.
          </p>
        )}

        {output && (
          <div className="space-y-5">
            <p className="text-[11px] text-muted-foreground">
              {restoredFromHistory
                ? "Caricato dalla cronologia."
                : aiUsed
                  ? "Generato con AI."
                  : "Generato con il motore interno (fallback)."}
            </p>

            {output.posts.map((post, index) => {
              const label = PLATFORMS.find((p) => p.id === post.platform)?.label ?? post.platform;
              return (
                <div key={`${post.platform}-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                      {label}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(post.caption, `Post ${label}`)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <Textarea
                    readOnly
                    rows={4}
                    className="text-sm leading-relaxed"
                    value={post.caption}
                  />
                </div>
              );
            })}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Amazon Ads — Headline
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.adsHeadlines.join("\n"), "Headline Ads")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {output.adsHeadlines.map((h, i) => (
                  <div key={`h-${i}`} className="flex items-center gap-2">
                    <Input readOnly value={h} className="h-9 text-xs" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[11px]"
                      onClick={() => copyToClipboard(h, `Headline ${i + 1}`)}
                    >
                      Copia
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Amazon Ads — Bullet
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.adsBullets.join("\n"), "Bullet Ads")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {output.adsBullets.map((b, i) => (
                  <div key={`b-${i}`} className="flex items-center gap-2">
                    <Input readOnly value={b} className="h-9 text-xs" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-[11px]"
                      onClick={() => copyToClipboard(b, `Bullet ${i + 1}`)}
                    >
                      Copia
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Email di lancio
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(output.launchEmail, "Email di lancio")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea
                readOnly
                rows={8}
                className="font-mono text-xs leading-relaxed"
                value={output.launchEmail}
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
