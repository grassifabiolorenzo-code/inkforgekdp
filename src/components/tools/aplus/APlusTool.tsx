import { Copy, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { newOperationId } from "@/hooks/useAccount";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";

/**
 * TOOL 3 — A+ KDPstudio (modulo indipendente).
 * 1 credito per ogni generazione completata con successo.
 */

const LANGUAGES = [
  { id: "it", label: "Italiano" },
  { id: "en", label: "Inglese" },
  { id: "es", label: "Spagnolo" },
  { id: "de", label: "Tedesco" },
  { id: "fr", label: "Francese" },
];

interface APlusModule {
  heading: string;
  body: string;
  bullets: string[];
}

interface APlusResult {
  language: string;
  modules: APlusModule[];
}

export function APlusTool({ runtime }: { runtime: ToolRuntime }) {
  const [bookTitle, setBookTitle] = useState("");
  const [highlights, setHighlights] = useState("");
  const [langs, setLangs] = useState<string[]>(["it"]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<APlusResult[]>([]);

  function toggleLang(id: string) {
    setLangs((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]));
  }

  async function handleGenerate() {
    if (!bookTitle.trim() || langs.length === 0) {
      toast.error("Inserisci il titolo e almeno una lingua.");
      return;
    }
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    // Verifica server-side del piano e dei crediti.
    if (!(await runtime.ensureAccess())) return;

    setGenerating(true);
    const operationId = newOperationId("aplus-gen");

    try {
      const generated = langs.map((lang) => buildAPlus(lang, bookTitle, highlights));
      const result = await runtime.charge(operationId, "Generazione completata");
      if (!result.ok) return;
      setResults(generated);
      toast.success(result.duplicate ? "Generazione completata" : "Generazione completata — 1 credito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generazione non riuscita");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel grid gap-5 p-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="a-title">Titolo del libro</Label>
            <Input
              id="a-title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Es. Il grande libro delle attività"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-highlights">Punti di forza (uno per riga)</Label>
            <Textarea
              id="a-highlights"
              rows={5}
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder={"120 attività illustrate\nCarta di alta qualità\nAdatto dai 5 anni"}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Lingue di output</Label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {LANGUAGES.map((lang) => (
                <label
                  key={lang.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={langs.includes(lang.id)}
                    onCheckedChange={() => toggleLang(lang.id)}
                  />
                  {lang.label}
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || runtime.charging}
            className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
          >
            {generating || runtime.charging ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Genera contenuti A+ (1 credito)
          </Button>
          <p className="text-xs text-muted-foreground">
            Una generazione = 1 credito, indipendentemente dal numero di lingue selezionate.
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          I moduli A+ generati appariranno qui.
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((result) => (
            <section key={result.language} className="panel space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {LANGUAGES.find((l) => l.id === result.language)?.label ?? result.language}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      result.modules
                        .map((m) => `${m.heading}\n${m.body}\n${m.bullets.map((b) => `• ${b}`).join("\n")}`)
                        .join("\n\n"),
                    );
                    toast.success("Contenuti copiati");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {result.modules.map((module) => (
                  <article
                    key={module.heading}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <h4 className="text-sm font-semibold">{module.heading}</h4>
                    <p className="mt-2 text-xs text-muted-foreground">{module.body}</p>
                    <ul className="mt-3 space-y-1 text-xs">
                      {module.bullets.map((b) => (
                        <li key={b}>• {b}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

const COPY: Record<string, { h: string[]; intro: string; why: string; who: string }> = {
  it: {
    h: ["Panoramica", "Perché scegliere questo libro", "Per chi è"],
    intro: "Un volume curato, pensato per accompagnare il lettore passo dopo passo.",
    why: "Qualità di stampa, struttura chiara e contenuti verificati.",
    who: "Ideale per lettori curiosi, famiglie e insegnanti.",
  },
  en: {
    h: ["Overview", "Why choose this book", "Who it's for"],
    intro: "A carefully crafted volume designed to guide the reader step by step.",
    why: "Print quality, clear structure and verified content.",
    who: "Perfect for curious readers, families and teachers.",
  },
  es: {
    h: ["Resumen", "Por qué elegir este libro", "Para quién es"],
    intro: "Un volumen cuidado, pensado para acompañar al lector paso a paso.",
    why: "Calidad de impresión, estructura clara y contenidos verificados.",
    who: "Ideal para lectores curiosos, familias y docentes.",
  },
  de: {
    h: ["Überblick", "Warum dieses Buch", "Für wen es ist"],
    intro: "Ein sorgfältig gestaltetes Buch, das den Leser Schritt für Schritt begleitet.",
    why: "Druckqualität, klare Struktur und geprüfte Inhalte.",
    who: "Ideal für neugierige Leser, Familien und Lehrkräfte.",
  },
  fr: {
    h: ["Aperçu", "Pourquoi ce livre", "À qui il s'adresse"],
    intro: "Un ouvrage soigné, conçu pour accompagner le lecteur pas à pas.",
    why: "Qualité d'impression, structure claire et contenus vérifiés.",
    who: "Idéal pour les lecteurs curieux, les familles et les enseignants.",
  },
};

function buildAPlus(language: string, title: string, highlights: string): APlusResult {
  const copy = COPY[language] ?? COPY["it"]!;
  const bullets = highlights
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean);
  const fallback = bullets.length > 0 ? bullets : ["Contenuti originali", "Layout professionale"];

  return {
    language,
    modules: [
      { heading: `${copy.h[0]} — ${title}`, body: copy.intro, bullets: fallback.slice(0, 3) },
      { heading: copy.h[1]!, body: copy.why, bullets: fallback.slice(0, 4) },
      { heading: copy.h[2]!, body: copy.who, bullets: fallback.slice(0, 2) },
    ],
  };
}
