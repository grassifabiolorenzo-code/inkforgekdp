import { Copy, Download, Loader2, Sparkles } from "lucide-react";
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
import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { AiStyleControls } from "@/components/tools/ai/AiStyleControls";
import { DEFAULT_CREATIVITY, DEFAULT_TONE } from "@/components/tools/ai/aiStyle";
import { generatePromoCopy } from "@/lib/aiCopy.functions";

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
  const chargeGuard = useRef(false);

  function update(patch: Partial<Omit<PromoInput, "tone">>) {
    setInput((prev) => ({ ...prev, ...patch }));
  }

  function togglePlatform(platform: PromoPlatform, checked: boolean) {
    setInput((prev) => ({
      ...prev,
      platforms: checked ? [...prev.platforms, platform] : prev.platforms.filter((p) => p !== platform),
    }));
  }

  function copyToClipboard(text: string, label: string) {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([formatPromoKitForExport({ ...input, tone }, output)], { type: "text/plain;charset=utf-8" });
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
        let result = generatePromoKitLocal(fullInput);
        let usedAi = false;

        if (useAi) {
          try {
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
              },
            });
            if (response.ok) {
              const validPlatforms = new Set(PLATFORMS.map((p) => p.id));
              const posts = response.copy.posts
                .filter((p) => validPlatforms.has(p.platform as PromoPlatform))
                .map((p) => ({ platform: p.platform as PromoPlatform, caption: p.caption }));
              result = {
                posts: posts.length > 0 ? posts : result.posts,
                adsHeadlines: response.copy.adsHeadlines.length > 0 ? response.copy.adsHeadlines : result.adsHeadlines,
                adsBullets: response.copy.adsBullets.length > 0 ? response.copy.adsBullets : result.adsBullets,
                launchEmail: response.copy.launchEmail || result.launchEmail,
              };
              usedAi = true;
            } else {
              toast.warning(`AI non disponibile: ${response.error}. Usato il motore interno.`);
            }
          } catch (aiError) {
            console.error(aiError);
            toast.warning("Generazione AI non riuscita: usato il motore interno.");
          }
        }

        const charge = await runtime.charge(operationId, "Generazione promo kit completata");
        if (!charge.ok) return;
        setOutput(result);
        setAiUsed(usedAi);
        toast.success(charge.duplicate ? "Generazione completata" : "Generazione completata — 1 credito");
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
            Post social multi-piattaforma, headline/bullet Amazon Ads ed email di lancio in un click.
          </p>
        </div>

        <OutputLanguageSelect id="pr-output-lang" />

        <div className="space-y-1.5">
          <Label htmlFor="pr-title">Titolo del libro</Label>
          <Input id="pr-title" value={input.bookTitle} onChange={(e) => update({ bookTitle: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-genre">Genere (per hashtag, opzionale)</Label>
          <Input id="pr-genre" value={input.genre} onChange={(e) => update({ genre: e.target.value })} placeholder="Es. thriller, self-help, fantasy..." />
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
          <Input id="pr-audience" value={input.audience} onChange={(e) => update({ audience: e.target.value })} placeholder="Es. lettori di narrativa contemporanea" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pr-cta">Call to action (opzionale)</Label>
          <Input id="pr-cta" value={input.cta} onChange={(e) => update({ cta: e.target.value })} placeholder="Es. Disponibile ora su Amazon in cartaceo ed eBook." />
        </div>

        <div className="space-y-2">
          <Label className="text-xs tracking-wide uppercase text-muted-foreground">Piattaforme social</Label>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-sm">
                <Checkbox
                  checked={input.platforms.includes(p.id)}
                  onCheckedChange={(checked) => togglePlatform(p.id, checked === true)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
          <div className="space-y-0.5">
            <Label htmlFor="pr-use-ai" className="text-sm">
              Genera con AI (consigliato)
            </Label>
            <p className="text-xs text-muted-foreground">
              Testi scritti su misura nella lingua scelta sopra. Se l'AI non è disponibile, viene usato
              automaticamente un motore interno di riserva (solo italiano).
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

        <Button className="w-full" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Genera — 1 credito
        </Button>
      </div>

      <div className="panel space-y-4 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Risultato</h3>

        {!output && (
          <p className="text-sm text-muted-foreground">
            Compila il form e premi "Genera" per ottenere post social, ads Amazon ed email di lancio pronti da
            usare.
          </p>
        )}

        {output && (
          <div className="space-y-5">
            <p className="text-[11px] text-muted-foreground">
              {aiUsed ? "Generato con AI." : "Generato con il motore interno (fallback)."}
            </p>

            {output.posts.map((post, index) => {
              const label = PLATFORMS.find((p) => p.id === post.platform)?.label ?? post.platform;
              return (
                <div key={`${post.platform}-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-xs tracking-wide uppercase text-muted-foreground">{label}</Label>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(post.caption, `Post ${label}`)}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                  <Textarea readOnly rows={4} className="text-sm leading-relaxed" value={post.caption} />
                </div>
              );
            })}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">Amazon Ads — Headline</Label>
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
                  <Input key={`h-${i}`} readOnly value={h} className="h-9 text-xs" />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">Amazon Ads — Bullet</Label>
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
                  <Input key={`b-${i}`} readOnly value={b} className="h-9 text-xs" />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">Email di lancio</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output.launchEmail, "Email di lancio")}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea readOnly rows={8} className="font-mono text-xs leading-relaxed" value={output.launchEmail} />
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
