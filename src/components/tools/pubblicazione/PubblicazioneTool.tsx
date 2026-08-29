import { Copy, Download, ImageIcon, Loader2, Upload, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";

import {
  type Audience,
  type BookType,
  defaultAgeDetails,
  formatListingForExport,
  generateListing,
  type Listing,
} from "@/components/tools/pubblicazione/listingLogic";
import { analyzeInteriorPdf, type InteriorAnalysisResult } from "@/components/tools/pubblicazione/pdfAnalysis";

/**
 * TOOL 2 — Pubblicazione (Amazon KDP International Listing Suite).
 * Porting fedele dell'app standalone: analisi reale del PDF interno,
 * generazione di titolo/sottotitolo/descrizione PAS+AIDA, 7 keyword backend,
 * categorie BISAC, audit qualità/conformità e stima del potenziale di vendita.
 * 1 credito per ogni generazione completata con successo.
 */

const BOOK_TYPES: { id: BookType; label: string }[] = [
  { id: "coloring", label: "Coloring Book" },
  { id: "activity", label: "Activity Book (Labirinti, Puzzle)" },
  { id: "notebook", label: "Music Staff / Quaderno Speciale" },
  { id: "exercise", label: "Quaderno Didattico" },
];

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "toddlers", label: "Bambini (2-8 anni)" },
  { id: "teens", label: "Ragazzi / Preadolescenti (9-14 anni)" },
  { id: "adults", label: "Adulti & Relax" },
];

export function PubblicazioneTool({ runtime }: { runtime: ToolRuntime }) {
  const [subject, setSubject] = useState("");
  const [bookType, setBookType] = useState<BookType>("coloring");
  const [audience, setAudience] = useState<Audience>("toddlers");
  const [ageDetails, setAgeDetails] = useState(defaultAgeDetails("toddlers"));

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const [interiorStatus, setInteriorStatus] = useState<string>("");
  const [interiorStatusOk, setInteriorStatusOk] = useState<boolean | null>(null);
  const [interiorAnalysis, setInteriorAnalysis] = useState<InteriorAnalysisResult>({
    scanned: false,
    totalPages: 0,
    errorsFound: [],
  });
  const [analyzingInterior, setAnalyzingInterior] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);

  function handleAudienceChange(value: Audience) {
    setAudience(value);
    setAgeDetails(defaultAgeDetails(value));
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (!file) {
      setCoverPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleInteriorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setInteriorFile(file);
    setInteriorAnalysis({ scanned: false, totalPages: 0, errorsFound: [] });
    if (!file) {
      setInteriorStatus("");
      setInteriorStatusOk(null);
      return;
    }
    setAnalyzingInterior(true);
    setInteriorStatus("Analisi pagine in corso...");
    setInteriorStatusOk(null);
    try {
      const result = await analyzeInteriorPdf(file);
      setInteriorAnalysis(result);
      setInteriorStatus(`Analisi completata: ${result.totalPages} pagine scansionate con successo.`);
      setInteriorStatusOk(true);
    } catch (error) {
      console.error(error);
      setInteriorStatus("Errore durante la lettura del PDF interno.");
      setInteriorStatusOk(false);
    } finally {
      setAnalyzingInterior(false);
    }
  }

  const chargeGuard = useRef(false);

  async function handleGenerate() {
    // Guardia sincrona: blocca doppio click/rientranza prima di qualsiasi await.
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    // Verifica server-side del piano e dei crediti.
    if (!(await runtime.ensureAccess())) return;

    setGenerating(true);
    const operationId = newOperationId("pubblicazione-gen");

    try {
      const result = generateListing({
        subject,
        bookType,
        audience,
        ageDetails,
        hasCover: !!coverFile,
        hasInterior: !!interiorFile,
        interiorScanned: interiorAnalysis.scanned,
        interiorPages: interiorAnalysis.totalPages,
      });

      // Generazione completata → consumo del credito.
      const charge = await runtime.charge(operationId, "Generazione listing KDP completata");
      if (!charge.ok) return;
      setListing(result);
      toast.success(charge.duplicate ? "Generazione completata" : "Generazione completata — 1 credito");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generazione non riuscita");
    } finally {
      setGenerating(false);
    }
  } finally {
      chargeGuard.current = false;
    }
  

  function copyToClipboard(text: string, label: string) {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  }

  function downloadListing() {
    if (!listing) return;
    const blob = new Blob([formatListingForExport(listing)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kdp-listing-${(subject || "listing").toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="panel space-y-5 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          Amazon KDP Listing Suite
        </h3>
        <p className="text-xs text-muted-foreground">
          PAS &amp; AIDA + Long-Tail SEO + Audit AI qualità interno
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="p-subject">Soggetto / Personaggio</Label>
          <Input
            id="p-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Es. Bradipo Kawaii, Pattern Geometrici, T-Rex"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Formato / tipo di libro</Label>
          <Select value={bookType} onValueChange={(v) => setBookType(v as BookType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOK_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Pubblico di riferimento</Label>
          <Select value={audience} onValueChange={(v) => handleAudienceChange(v as Audience)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIENCES.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p-age">Sotto-target specifico</Label>
          <Input id="p-age" value={ageDetails} onChange={(e) => setAgeDetails(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Copertina (PDF/PNG)</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent">
            <Upload className="size-4" />
            {coverFile ? `Caricata: ${coverFile.name}` : "Clicca per caricare la copertina"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleCoverChange} />
          </label>
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Anteprima copertina"
              className="mt-1 h-28 w-20 rounded-md border border-border object-cover"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>File interno (PDF)</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent">
            {analyzingInterior ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
            {interiorFile ? `Caricato: ${interiorFile.name}` : "Clicca per caricare il PDF interno"}
            <input type="file" accept=".pdf" className="hidden" onChange={handleInteriorChange} />
          </label>
          {interiorStatus && (
            <p
              className={`text-xs italic ${
                interiorStatusOk === true
                  ? "text-emerald-600 dark:text-emerald-400"
                  : interiorStatusOk === false
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {interiorStatus}
            </p>
          )}
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
          Genera listing PAS &amp; AIDA (1 credito)
        </Button>
        <p className="text-xs text-muted-foreground">
          Ogni generazione completata consuma 1 credito. Le generazioni non riuscite non vengono
          addebitate.
        </p>
      </div>

      <div className="space-y-4">
        {!listing ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            Nessuna generazione ancora. Compila i campi e genera il tuo primo listing KDP.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="panel space-y-1 border-l-4 border-l-amber-400 p-5">
                <h4 className="text-sm font-semibold">🔍 Audit Qualità &amp; Conformità</h4>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {listing.complianceScore} / 100
                </p>
                <p className="text-xs text-muted-foreground">{listing.complianceText}</p>
              </div>
              <div className="panel space-y-1 border-l-4 border-l-emerald-500 p-5">
                <h4 className="text-sm font-semibold">📈 Potenziale di Vendita (vs Bestseller)</h4>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {listing.salesScore} / 100
                </p>
                <p className="text-xs text-muted-foreground">{listing.salesText}</p>
              </div>
            </div>

            {listing.interiorPages > 0 && (
              <p className="text-xs text-muted-foreground">
                Pagine interne analizzate: <strong>{listing.interiorPages}</strong>
              </p>
            )}

            <article className="panel space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">Titolo</p>
                  <h3 className="font-semibold">{listing.title}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(listing.title, "Titolo")}>
                  <Copy className="size-4" />
                </Button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">Sottotitolo</p>
                  <p className="text-sm text-accent">{listing.subtitle}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(listing.subtitle, "Sottotitolo")}>
                  <Copy className="size-4" />
                </Button>
              </div>

              <div className="flex items-start justify-between gap-3">
                <p className="text-xs tracking-wide uppercase text-muted-foreground">
                  Descrizione A+/HTML (PAS + AIDA)
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(listing.description, "Descrizione")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div
                className="rounded-md border border-border bg-surface p-3 font-mono text-xs whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: listing.description.replace(/\n/g, "<br>") }}
              />

              <div>
                <p className="text-xs tracking-wide uppercase text-muted-foreground">
                  7 Keyword Backend (Search Terms — campi singoli)
                </p>
                <div className="mt-2 space-y-1.5">
                  {listing.keywords.map((kw, index) => (
                    <div
                      key={kw}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs"
                    >
                      <span>
                        <strong>Box {index + 1}:</strong> {kw}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => copyToClipboard(kw, `Keyword Box ${index + 1}`)}
                      >
                        Copia
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-wide uppercase text-muted-foreground">
                    3 Categorie ad alto traffico (BISAC)
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                    {listing.categories.map((cat) => (
                      <li key={cat}>{cat}</li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(listing.categories.join("\n"), "Categorie")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>

              <Button variant="outline" className="w-full" onClick={downloadListing}>
                <Download className="mr-2 size-4" />
                Esporta listing (.txt)
              </Button>
            </article>
          </>
        )}
      </div>
    </div>
  );
  }
