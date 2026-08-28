import { Copy, Loader2, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { newOperationId } from "@/hooks/useAccount";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";

/**
 * TOOL 2 — Pubblicazione (modulo indipendente).
 * 1 credito per ogni generazione completata con successo.
 */

interface Listing {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories: string[];
}

const LANGS = [
  { id: "it", label: "Italiano" },
  { id: "en", label: "Inglese" },
  { id: "es", label: "Spagnolo" },
  { id: "de", label: "Tedesco" },
];

export function PubblicazioneTool({ runtime }: { runtime: ToolRuntime }) {
  const [titleInput, setTitleInput] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [lang, setLang] = useState("it");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Listing[]>([]);

  async function handleGenerate() {
    if (!titleInput.trim() || !topic.trim()) {
      toast.error("Inserisci almeno titolo e argomento.");
      return;
    }
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    // Verifica server-side del piano e dei crediti.
    if (!(await runtime.ensureAccess())) return;

    setGenerating(true);
    const operationId = newOperationId("pubblicazione-gen");

    try {
      const listing = await buildListing({ titleInput, topic, audience, lang });
      // Generazione completata → consumo del credito.
      const result = await runtime.charge(operationId, "Generazione completata");
      if (!result.ok) return;
      setResults((prev) => [listing, ...prev]);
      toast.success(result.duplicate ? "Generazione completata" : "Generazione completata — 1 credito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generazione non riuscita");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="panel space-y-5 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Dati del libro
        </h3>

        <div className="space-y-1.5">
          <Label htmlFor="p-title">Titolo di lavoro</Label>
          <Input
            id="p-title"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Es. Quaderno di esercizi di matematica"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-topic">Argomento / nicchia</Label>
          <Input
            id="p-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Es. matematica scuola primaria"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-audience">Pubblico</Label>
          <Textarea
            id="p-audience"
            rows={3}
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Es. genitori e insegnanti di bambini 6-10 anni"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Lingua del listing</Label>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || runtime.charging}
          className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
        >
          {generating || runtime.charging ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 size-4" />
          )}
          Genera listing (1 credito)
        </Button>
        <p className="text-xs text-muted-foreground">
          Ogni generazione completata consuma 1 credito. Le generazioni non riuscite non vengono
          addebitate.
        </p>
      </div>

      <div className="space-y-4">
        {results.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            Nessuna generazione ancora. Compila i campi e genera il tuo primo listing.
          </div>
        ) : (
          results.map((listing, index) => (
            <article key={`${listing.title}-${index}`} className="panel space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{listing.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(formatListing(listing));
                    toast.success("Listing copiato");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-accent">{listing.subtitle}</p>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {listing.description}
              </p>
              <div>
                <p className="text-xs tracking-wide uppercase text-muted-foreground">Keyword</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.keywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs tracking-wide uppercase text-muted-foreground">Categorie</p>
                <p className="mt-1 text-sm">{listing.categories.join(" · ")}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function formatListing(l: Listing) {
  return `${l.title}\n${l.subtitle}\n\n${l.description}\n\nKeyword: ${l.keywords.join(", ")}\nCategorie: ${l.categories.join(", ")}`;
}

async function buildListing(input: {
  titleInput: string;
  topic: string;
  audience: string;
  lang: string;
}): Promise<Listing> {
  const { titleInput, topic, audience } = input;
  const base = titleInput.trim();

  return {
    title: base,
    subtitle: `${capitalize(topic)} — guida pratica ${audience ? `per ${audience.split(",")[0]}` : ""}`.trim(),
    description: [
      `${base} è pensato per chi cerca un percorso chiaro su ${topic}.`,
      "",
      "Cosa troverai:",
      `• Struttura progressiva dedicata a ${audience || "lettori di ogni livello"}`,
      "• Esercizi ed esempi pronti all'uso",
      "• Layout ottimizzato per la stampa KDP",
      "",
      "Un volume curato nei dettagli, pronto per essere pubblicato e apprezzato.",
    ].join("\n"),
    keywords: [
      topic,
      `${topic} libro`,
      `${topic} guida`,
      `${topic} esercizi`,
      `${topic} principianti`,
      `${base.toLowerCase()}`,
      `manuale ${topic}`,
    ].slice(0, 7),
    categories: ["Libri > Istruzione", `Libri > ${capitalize(topic)}`],
  };
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
