import { Copy, Download, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";
import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { AiStyleControls } from "@/components/tools/ai/AiStyleControls";
import { DEFAULT_CREATIVITY, DEFAULT_TONE } from "@/components/tools/ai/aiStyle";
import { generateBlurbCopy } from "@/lib/aiCopy.functions";

import {
  type BlurbInput,
  type BlurbOutput,
  GENRES,
  formatBlurbForExport,
  generateBlurbLocal,
} from "@/components/tools/blurb/blurbLogic";

/**
 * TOOL 6 — Blurb & Sinossi.
 * Genera quarta di copertina, sinossi ed editorial blurb per narrativa e
 * saggistica, via AI (multilingua) con fallback locale istantaneo se l'AI
 * non è disponibile. 1 credito per ogni generazione completata.
 */
export function BlurbTool({ runtime }: { runtime: ToolRuntime }) {
  const outputLocale = useOutputLanguage();
  const [input, setInput] = useState<Omit<BlurbInput, "tone">>({
    title: "",
    genre: "narrativa",
    protagonist: "",
    setting: "",
    conflict: "",
    stakes: "",
  });
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [creativity, setCreativity] = useState(DEFAULT_CREATIVITY);
  const [useAi, setUseAi] = useState(true);
  const [aiUsed, setAiUsed] = useState(false);
  const [output, setOutput] = useState<BlurbOutput | null>(null);
  const [generating, setGenerating] = useState(false);
  const chargeGuard = useRef(false);

  function update(patch: Partial<Omit<BlurbInput, "tone">>) {
    setInput((prev) => ({ ...prev, ...patch }));
  }

  function copyToClipboard(text: string, label: string) {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  }

  function downloadOutput() {
    if (!output) return;
    const blob = new Blob([formatBlurbForExport({ ...input, tone }, output)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blurb-${(input.title || "libro").toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleGenerate() {
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
      if (!input.title.trim() || !input.protagonist.trim() || !input.conflict.trim()) {
        toast.error("Compila almeno titolo, protagonista/argomento e conflitto/tema centrale");
        return;
      }
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setGenerating(true);
      const operationId = newOperationId("blurb-gen");
      try {
        const fullInput: BlurbInput = { ...input, tone };
        let result = generateBlurbLocal(fullInput);
        let usedAi = false;

        if (useAi) {
          try {
            const response = await generateBlurbCopy({
              data: {
                locale: outputLocale,
                title: input.title,
                genre: GENRES.find((g) => g.id === input.genre)?.label ?? input.genre,
                protagonist: input.protagonist,
                setting: input.setting || undefined,
                conflict: input.conflict,
                stakes: input.stakes || undefined,
                tone,
                creativity,
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

        const charge = await runtime.charge(operationId, "Generazione blurb/sinossi completata");
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
            Blurb & Sinossi
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Per narrativa e saggistica: quarta di copertina, sinossi ed editorial blurb, in qualsiasi genere.
          </p>
        </div>

        <OutputLanguageSelect id="b-output-lang" />

        <div className="space-y-1.5">
          <Label htmlFor="b-title">Titolo del libro</Label>
          <Input id="b-title" value={input.title} onChange={(e) => update({ title: e.target.value })} placeholder="Es. L'ultima notte a Trieste" />
        </div>

        <div className="space-y-1.5">
          <Label>Genere</Label>
          <Select value={input.genre} onValueChange={(v) => update({ genre: v as BlurbInput["genre"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="b-protagonist">Protagonista / argomento principale</Label>
          <Input
            id="b-protagonist"
            value={input.protagonist}
            onChange={(e) => update({ protagonist: e.target.value })}
            placeholder="Es. Anna, archivista trentenne — oppure: la gestione del tempo per freelance"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="b-setting">Ambientazione / contesto (opzionale)</Label>
          <Input id="b-setting" value={input.setting} onChange={(e) => update({ setting: e.target.value })} placeholder="Es. una Trieste degli anni '50 avvolta nella nebbia" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="b-conflict">Conflitto centrale / tema chiave</Label>
          <Textarea
            id="b-conflict"
            rows={3}
            value={input.conflict}
            onChange={(e) => update({ conflict: e.target.value })}
            placeholder="Es. scopre una lettera che rimette in discussione tutto ciò che credeva della propria famiglia"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="b-stakes">Posta in gioco (opzionale)</Label>
          <Input
            id="b-stakes"
            value={input.stakes}
            onChange={(e) => update({ stakes: e.target.value })}
            placeholder="Es. l'eredità di famiglia e la verità su suo padre"
          />
        </div>

        <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3">
          <div className="space-y-0.5">
            <Label htmlFor="b-use-ai" className="text-sm">
              Genera con AI (consigliato)
            </Label>
            <p className="text-xs text-muted-foreground">
              Testi scritti su misura nella lingua scelta sopra. Se l'AI non è disponibile, viene usato
              automaticamente un motore interno di riserva (solo italiano).
            </p>
          </div>
          <Switch id="b-use-ai" checked={useAi} onCheckedChange={setUseAi} />
        </div>

        <AiStyleControls
          idPrefix="b-ai"
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
            Compila il form e premi "Genera" per ottenere hook, sinossi ed editorial blurb. Ogni generazione produce
            una variante nuova: puoi rigenerare per confrontare più versioni.
          </p>
        )}

        {output && (
          <div className="space-y-5">
            <p className="text-[11px] text-muted-foreground">
              {aiUsed ? "Generato con AI." : "Generato con il motore interno (fallback)."}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">Hook / prima riga</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output.hook, "Hook")}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea readOnly rows={2} className="text-sm" value={output.hook} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">
                  Sinossi / quarta di copertina ({output.synopsis.length} caratteri)
                </Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output.synopsis, "Sinossi")}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea readOnly rows={8} className="text-sm leading-relaxed" value={output.synopsis} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-xs tracking-wide uppercase text-muted-foreground">Editorial blurb</Label>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output.editorialBlurb, "Editorial blurb")}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <Textarea readOnly rows={2} className="text-sm italic" value={output.editorialBlurb} />
            </div>

            <Button variant="outline" className="w-full" onClick={downloadOutput}>
              <Download className="mr-2 size-4" /> Esporta (.txt)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
