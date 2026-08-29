import { Download, Loader2, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";

import { AGES, LANGUAGES, NICHES } from "@/components/tools/aplus/constants";
import { generateModulesText, nextCopyVariationIndex } from "@/components/tools/aplus/copyEngine";
import type { AgeId, GeneratedModulesText, LangId, NicheId } from "@/components/tools/aplus/types";
import { exportModulesAsZip, type ModuleCanvases } from "@/components/tools/aplus/zipExport";

/**
 * TOOL — A+1 KDP Studio (modulo indipendente).
 * Porting fedele di A_KDPstudio_migliorato.html: rendering canvas dei 5 moduli
 * A+ (hero, proof, value, grid x3, compare), copy multilingua/età e export ZIP.
 * 1 credito per ogni generazione completata con successo.
 */

export function APlusTool({ runtime }: { runtime: ToolRuntime }) {
  const [title, setTitle] = useState("Olimpia Pubblicazioni");
  const [niche, setNiche] = useState<NicheId>("coloring");
  const [lang, setLang] = useState<LangId>("it");
  const [age, setAge] = useState<AgeId>("4-6");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoScale, setLogoScale] = useState(100);

  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(2);
  const [page3, setPage3] = useState(3);

  const [bgColor, setBgColor] = useState("#ffffff");
  const [accentColor, setAccentColor] = useState("#0f172a");

  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("In attesa dei file sorgente...");
  const [texts, setTexts] = useState<GeneratedModulesText | null>(null);
  const [canvasesReady, setCanvasesReady] = useState(false);

  async function handleGenerate() {
    // Guardia sincrona: blocca doppio click/rientranza prima di qualsiasi await.
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
    if (!coverFile || !interiorFile) {
      toast.error("Carica sia il PDF di copertina che il PDF interno.");
      return;
    }
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }

    // Verifica server-side del piano e dei crediti.
    if (!(await runtime.ensureAccess())) return;

    setGenerating(true);
    setStatus(`Rendering A+1 in corso per il mercato [${lang.toUpperCase()}]...`);
    const operationId = newOperationId("aplus-gen");

    try {
      const [
        { renderPdfPage, loadLogoFromFile },
        { drawHero, drawProof, drawValueModule, drawGridSquare, drawCompareHeader },
      ] = await Promise.all([
        import("@/components/tools/aplus/pdfEngine"),
        import("@/components/tools/aplus/canvasRenderers"),
      ]);

      const logoImg = logoFile ? await loadLogoFromFile(logoFile) : null;
      const frontCoverImg = await renderPdfPage(coverFile, 1, true, false);
      const backCoverImg = await renderPdfPage(coverFile, 1, true, true);
      const intImg1 = await renderPdfPage(interiorFile, page1, false);
      const intImg2 = await renderPdfPage(interiorFile, page2, false);
      const intImg3 = await renderPdfPage(interiorFile, page3, false);

      const variationIndex = nextCopyVariationIndex();
      const generatedTexts = generateModulesText({
        lang,
        niche,
        age,
        pages: [page1, page2, page3],
        variationIndex,
      });

      const heroCanvas = document.getElementById("aplus-hero") as HTMLCanvasElement | null;
      const proofCanvas = document.getElementById("aplus-proof") as HTMLCanvasElement | null;
      const valueCanvas = document.getElementById("aplus-value") as HTMLCanvasElement | null;
      const grid1Canvas = document.getElementById("aplus-grid1") as HTMLCanvasElement | null;
      const grid2Canvas = document.getElementById("aplus-grid2") as HTMLCanvasElement | null;
      const grid3Canvas = document.getElementById("aplus-grid3") as HTMLCanvasElement | null;
      const compCanvas = document.getElementById("aplus-comp") as HTMLCanvasElement | null;

      if (
        !heroCanvas ||
        !proofCanvas ||
        !valueCanvas ||
        !grid1Canvas ||
        !grid2Canvas ||
        !grid3Canvas ||
        !compCanvas
      ) {
        throw new Error("Anteprima canvas non disponibile.");
      }

      drawHero(heroCanvas, frontCoverImg, backCoverImg, bgColor, logoImg, logoScale / 100);
      drawProof(proofCanvas, intImg1, intImg2, bgColor);
      drawValueModule(valueCanvas, bgColor, accentColor, generatedTexts.value);
      drawGridSquare(grid1Canvas, intImg1, bgColor);
      drawGridSquare(grid2Canvas, intImg2, bgColor);
      drawGridSquare(grid3Canvas, intImg3, bgColor);
      drawCompareHeader(compCanvas, frontCoverImg, bgColor);

      // Generazione completata → consumo del credito.
      const result = await runtime.charge(operationId, "Generazione moduli A+ completata");
      if (!result.ok) return;

      setTexts(generatedTexts);
      setCanvasesReady(true);
      setStatus(`Generazione A+1 completata per il mercato [${lang.toUpperCase()}]!`);
      toast.success(result.duplicate ? "Generazione completata" : "Generazione completata — 1 credito");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante l'elaborazione dei file.";
      setStatus(`Errore: ${message}`);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportZip() {
    if (!texts || !canvasesReady) {
      toast.error("Genera prima i moduli A+.");
      return;
    }

    setExporting(true);
    try {
      const heroCanvas = document.getElementById("aplus-hero") as HTMLCanvasElement;
      const proofCanvas = document.getElementById("aplus-proof") as HTMLCanvasElement;
      const valueCanvas = document.getElementById("aplus-value") as HTMLCanvasElement;
      const grid1Canvas = document.getElementById("aplus-grid1") as HTMLCanvasElement;
      const grid2Canvas = document.getElementById("aplus-grid2") as HTMLCanvasElement;
      const grid3Canvas = document.getElementById("aplus-grid3") as HTMLCanvasElement;
      const compCanvas = document.getElementById("aplus-comp") as HTMLCanvasElement;

      const canvases: ModuleCanvases = {
        hero: heroCanvas,
        proof: proofCanvas,
        value: valueCanvas,
        grid1: grid1Canvas,
        grid2: grid2Canvas,
        grid3: grid3Canvas,
        comp: compCanvas,
      };

      await exportModulesAsZip(canvases, texts, { title, lang, niche, age });
      toast.success("Pacchetto ZIP scaricato");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Esportazione ZIP non riuscita");
    } finally {
      setExporting(false);
    }
  }

  function handleFileChange(setter: (f: File | null) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.files?.[0] ?? null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="panel space-y-5 p-6">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          A+1 KDP Studio — Multi-Language Engine
        </h3>
        <p className="text-xs text-muted-foreground">
          Rendering mockup dei moduli A+ e copywriting SEO multilingua.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="a-title">Titolo / Nome Brand</Label>
          <Input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nicchia Editoriale</Label>
            <Select value={niche} onValueChange={(v) => setNiche(v as NicheId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NICHES.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Lingua Marketplace</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as LangId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Target di Età / Pubblico</Label>
          <Select value={age} onValueChange={(v) => setAge(v as AgeId)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGES.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>PDF Copertina Completa</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent">
            <Upload className="size-4" />
            {coverFile ? `Caricato: ${coverFile.name}` : "Clicca per caricare la copertina (PDF)"}
            <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange(setCoverFile)} />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>PDF Interno Libro</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent">
            <Upload className="size-4" />
            {interiorFile ? `Caricato: ${interiorFile.name}` : "Clicca per caricare l'interno (PDF)"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange(setInteriorFile)}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-p1">Pag. A</Label>
            <Input
              id="a-p1"
              type="number"
              min={1}
              value={page1}
              onChange={(e) => setPage1(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-p2">Pag. B</Label>
            <Input
              id="a-p2"
              type="number"
              min={1}
              value={page2}
              onChange={(e) => setPage2(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-p3">Pag. C</Label>
            <Input
              id="a-p3"
              type="number"
              min={1}
              value={page3}
              onChange={(e) => setPage3(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Logo Azienda (JPG / PNG / SVG)</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border bg-surface p-4 text-center text-xs text-muted-foreground hover:border-accent">
            <Upload className="size-4" />
            {logoFile ? `Caricato: ${logoFile.name}` : "Clicca per caricare il logo (opzionale)"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              className="hidden"
              onChange={handleFileChange(setLogoFile)}
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label>Dimensione Logo Modulo 1: {logoScale}%</Label>
          <Slider
            min={20}
            max={250}
            step={5}
            value={[logoScale]}
            onValueChange={(v) => setLogoScale(v[0] ?? 100)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="a-bg">Sfondo Moduli</Label>
            <Input
              id="a-bg"
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-10 w-full p-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-accent">Colore Evidenziatore</Label>
            <Input
              id="a-accent"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-10 w-full p-1"
            />
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
          Genera contenuti A+ multilingua (1 credito)
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleExportZip}
          disabled={exporting || !canvasesReady}
        >
          {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
          Scarica tutto in un unico ZIP
        </Button>

        <p className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">{status}</p>
        <p className="text-xs text-muted-foreground">
          Una generazione completata = 1 credito. Le generazioni non riuscite non vengono addebitate.
        </p>
      </div>

      <div className="space-y-4">
        <article className="panel space-y-3 p-6">
          <h4 className="text-sm font-semibold">Modulo 1: Hero Banner Brand (970×300 px)</h4>
          <div className="overflow-x-auto rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-hero" width={970} height={300} className="h-auto w-full max-w-2xl" />
          </div>
          {texts && (
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs">
              {`${texts.hero.title}\n\nTITOLO A+:\n${texts.hero.heading}\n\nTESTO DESCRITTIVO:\n${texts.hero.body}\n\nALT-TEXT SEO:\n${texts.hero.alt}`}
            </pre>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <h4 className="text-sm font-semibold">Modulo 2: Proof Banner Interni (970×300 px)</h4>
          <div className="overflow-x-auto rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-proof" width={970} height={300} className="h-auto w-full max-w-2xl" />
          </div>
          {texts && (
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs">
              {`${texts.proof.title}\n\nTITOLO A+:\n${texts.proof.heading}\n\nTESTO DESCRITTIVO:\n${texts.proof.body}\n\nALT-TEXT SEO:\n${texts.proof.alt}`}
            </pre>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <h4 className="text-sm font-semibold">Modulo 3: Value Highlights (970×300 px)</h4>
          <div className="overflow-x-auto rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-value" width={970} height={300} className="h-auto w-full max-w-2xl" />
          </div>
          {texts && (
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs">
              {`TITOLO SEZIONE:\n${texts.value.title}\n\nPUNTI CHIAVE:\n1. ${texts.value.text1}\n2. ${texts.value.text2}\n3. ${texts.value.text3}\n\nALT-TEXT SEO:\n${texts.value.alt}`}
            </pre>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <h4 className="text-sm font-semibold">Modulo 4: Feature Grid (3× 300×300 px)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-border bg-surface p-2">
              <canvas id="aplus-grid1" width={300} height={300} className="h-auto w-full" />
            </div>
            <div className="rounded-md border border-border bg-surface p-2">
              <canvas id="aplus-grid2" width={300} height={300} className="h-auto w-full" />
            </div>
            <div className="rounded-md border border-border bg-surface p-2">
              <canvas id="aplus-grid3" width={300} height={300} className="h-auto w-full" />
            </div>
          </div>
          {texts && (
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs">
              {`TESTI COLONNE A+ (${lang.toUpperCase()} - Target: ${age}):\n\n${texts.grid.items
                .map((g, i) => `• SLOT ${i + 1} (Pag. ${texts.grid.pages[i]}):\n${g.title}\n${g.desc}`)
                .join("\n\n")}`}
            </pre>
          )}
        </article>

        <article className="panel space-y-3 p-6">
          <h4 className="text-sm font-semibold">Modulo 5: Header Compare (150×300 px)</h4>
          <div className="w-40 rounded-md border border-border bg-surface p-2">
            <canvas id="aplus-comp" width={150} height={300} className="h-auto w-full" />
          </div>
          {texts && (
            <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-xs">
              {`ISTRUZIONI MODULO COMPARATIVO:\n${texts.comp.instructions}\n\nALT-TEXT SEO:\n${title} — ${texts.comp.alt}`}
            </pre>
          )}
        </article>

        {!texts && (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            Carica i file e genera per visualizzare le anteprime e i testi multilingua.
          </div>
        )}
      </div>
    </div>
  );
}
