import { Copy, Download, ImageOff, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ToolRuntime } from "@/components/tools/ToolPageShell";
import { newOperationId } from "@/hooks/useAccount";
import { OutputLanguageSelect, useOutputLanguage } from "@/components/tools/OutputLanguageSelect";
import { AiStyleControls } from "@/components/tools/ai/AiStyleControls";
import { DEFAULT_CREATIVITY, DEFAULT_TONE, type AiToneId } from "@/components/tools/ai/aiStyle";
import { generateAmazonCopy } from "@/lib/aiCopy.functions";

import {
  type AmazonListing,
  amazonListingToJson,
  createEmptyListing,
  filledBulletPoints,
  filledImages,
  filledSpecifics,
  formatAmazonListingForExport,
  nextId,
  slugifyFileName,
} from "@/components/tools/amazon/amazonListingLogic";

/**
 * TOOL 5 — Amazon Marketplace.
 * Form libero per schede prodotto Amazon Marketplace (non solo libri KDP):
 * l'utente inserisce quante più specificità vuole — bullet point, immagini
 * (via URL) e attributi personalizzati illimitati — poi esporta la scheda
 * pronta da incollare su Seller Central.
 * 1 credito per ogni esportazione completata con successo.
 */
export function AmazonMarketTool({ runtime }: { runtime: ToolRuntime }) {
  const outputLocale = useOutputLanguage();
  const [listing, setListing] = useState<AmazonListing>(() => createEmptyListing());
  const chargeGuard = useRef(false);
  const [exporting, setExporting] = useState(false);

  const [aiNotes, setAiNotes] = useState("");
  const [tone, setTone] = useState<AiToneId>(DEFAULT_TONE);
  const [creativity, setCreativity] = useState(DEFAULT_CREATIVITY);
  const [generatingAi, setGeneratingAi] = useState(false);

  function update(patch: Partial<AmazonListing>) {
    setListing((prev) => ({ ...prev, ...patch }));
  }

  // --- Bullet point dinamici -------------------------------------------------
  function updateBullet(index: number, value: string) {
    setListing((prev) => ({
      ...prev,
      bulletPoints: prev.bulletPoints.map((b, i) => (i === index ? value : b)),
    }));
  }
  function addBullet() {
    setListing((prev) => ({ ...prev, bulletPoints: [...prev.bulletPoints, ""] }));
  }
  function removeBullet(index: number) {
    setListing((prev) => ({ ...prev, bulletPoints: prev.bulletPoints.filter((_, i) => i !== index) }));
  }

  // --- Immagini dinamiche (solo URL) ------------------------------------------
  function updateImage(id: string, patch: Partial<{ url: string; alt: string }>) {
    setListing((prev) => ({
      ...prev,
      images: prev.images.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    }));
  }
  function addImage() {
    setListing((prev) => ({ ...prev, images: [...prev.images, { id: nextId("img"), url: "", alt: "" }] }));
  }
  function removeImage(id: string) {
    setListing((prev) => ({ ...prev, images: prev.images.filter((img) => img.id !== id) }));
  }

  // --- Specifiche / attributi personalizzati illimitati -----------------------
  function updateSpecific(id: string, patch: Partial<{ key: string; value: string }>) {
    setListing((prev) => ({
      ...prev,
      specifics: prev.specifics.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }
  function addSpecific() {
    setListing((prev) => ({ ...prev, specifics: [...prev.specifics, { id: nextId("spec"), key: "", value: "" }] }));
  }
  function removeSpecific(id: string) {
    setListing((prev) => ({ ...prev, specifics: prev.specifics.filter((s) => s.id !== id) }));
  }

  function copyToClipboard(text: string, label: string) {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copiato negli appunti`);
  }

  function downloadBlob(content: string, mime: string, filename: string) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Genera bullet point, descrizione e search term con AI. Gratuito: non consuma credito
   * (il credito si scala solo all'esportazione), ma resta comunque riservato agli account
   * attivi con questo tool incluso nel piano, per evitare abusi del motore AI.
   */
  async function handleGenerateAi() {
    if (!listing.productName.trim()) {
      toast.error("Inserisci almeno il titolo del prodotto prima di generare con AI");
      return;
    }
    if (!runtime.canOperate) {
      runtime.blockOperation();
      return;
    }
    if (!(await runtime.ensureAccess())) return;

    setGeneratingAi(true);
    try {
      const response = await generateAmazonCopy({
        data: {
          locale: outputLocale,
          productName: listing.productName,
          brand: listing.brand || undefined,
          category: listing.category || undefined,
          notes: aiNotes || undefined,
          tone,
          creativity,
        },
      });

      if (!response.ok) {
        toast.warning(`AI non disponibile: ${response.error}`);
        return;
      }

      const copy = response.copy;
      setListing((prev) => ({
        ...prev,
        bulletPoints: copy.bulletPoints.length > 0 ? copy.bulletPoints : prev.bulletPoints,
        description: copy.description || prev.description,
        searchTerms: copy.searchTerms || prev.searchTerms,
      }));
      toast.success("Contenuti generati con AI");
    } catch (error) {
      console.error(error);
      toast.warning("Generazione AI non riuscita, riprova tra qualche secondo.");
    } finally {
      setGeneratingAi(false);
    }
  }

  /** Esporta la scheda (txt o json). Ogni esportazione riuscita consuma 1 credito. */
  async function handleExport(format: "txt" | "json") {
    if (chargeGuard.current) return;
    chargeGuard.current = true;
    try {
      if (!listing.productName.trim()) {
        toast.error("Inserisci almeno il titolo del prodotto prima di esportare");
        return;
      }
      if (!runtime.canOperate) {
        runtime.blockOperation();
        return;
      }
      if (!(await runtime.ensureAccess())) return;

      setExporting(true);
      const operationId = newOperationId("amazon-export");
      try {
        const filename = slugifyFileName(listing.productName);
        if (format === "txt") {
          downloadBlob(formatAmazonListingForExport(listing), "text/plain", `amazon-listing-${filename}.txt`);
        } else {
          downloadBlob(amazonListingToJson(listing), "application/json", `amazon-listing-${filename}.json`);
        }

        const charge = await runtime.charge(operationId, "Esportazione scheda Amazon Marketplace completata");
        if (!charge.ok) return;
        toast.success(charge.duplicate ? "Esportazione completata" : "Esportazione completata — 1 credito");
      } finally {
        setExporting(false);
      }
    } finally {
      chargeGuard.current = false;
    }
  }

  const bulletCount = filledBulletPoints(listing).length;
  const imageCount = filledImages(listing).length;
  const specificsCount = filledSpecifics(listing).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* ------------------------------ FORM ------------------------------ */}
      <div className="panel space-y-6 p-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Scheda prodotto Amazon Marketplace
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Compila i campi standard e aggiungi tutte le immagini e le specifiche personalizzate che vuoi: non c'è
            un limite di campi.
          </p>
        </div>

        <OutputLanguageSelect id="am-output-lang" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="am-title">Titolo prodotto</Label>
            <Input
              id="am-title"
              value={listing.productName}
              onChange={(e) => update({ productName: e.target.value })}
              placeholder="Es. Zaino impermeabile porta laptop 15,6&quot; con USB"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-brand">Brand</Label>
            <Input id="am-brand" value={listing.brand} onChange={(e) => update({ brand: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-manufacturer">Produttore (opzionale)</Label>
            <Input
              id="am-manufacturer"
              value={listing.manufacturer}
              onChange={(e) => update({ manufacturer: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-category">Categoria</Label>
            <Input
              id="am-category"
              value={listing.category}
              onChange={(e) => update({ category: e.target.value })}
              placeholder="Es. Valigeria &gt; Zaini"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-sku">SKU (opzionale)</Label>
            <Input id="am-sku" value={listing.sku} onChange={(e) => update({ sku: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-price">Prezzo</Label>
            <Input
              id="am-price"
              inputMode="decimal"
              value={listing.price}
              onChange={(e) => update({ price: e.target.value })}
              placeholder="29,99"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="am-currency">Valuta</Label>
            <Input
              id="am-currency"
              value={listing.currency}
              onChange={(e) => update({ currency: e.target.value.toUpperCase() })}
              maxLength={3}
            />
          </div>
        </div>

        {/* Generazione con AI */}
        <div className="space-y-3 rounded-md border border-border bg-surface p-3">
          <div className="space-y-0.5">
            <Label htmlFor="am-ai-notes" className="text-sm">
              Genera bullet, descrizione e keyword con AI
            </Label>
            <p className="text-xs text-muted-foreground">
              Opzionale: aggiungi i punti di forza da valorizzare, poi genera. Puoi rigenerare quante volte vuoi
              prima di esportare — solo l'esportazione consuma 1 credito.
            </p>
          </div>
          <Textarea
            id="am-ai-notes"
            rows={2}
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="Es. tessuto impermeabile ripstop, scomparto imbottito per laptop 15,6&quot;, cinghie regolabili"
          />
          <AiStyleControls
            idPrefix="am-ai"
            tone={tone}
            onToneChange={setTone}
            creativity={creativity}
            onCreativityChange={setCreativity}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGenerateAi}
            disabled={generatingAi}
          >
            {generatingAi ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Genera con AI
          </Button>
        </div>

        {/* Bullet point */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">
              Bullet point ({bulletCount})
            </Label>
            <Button variant="ghost" size="sm" onClick={addBullet} className="h-7 gap-1 px-2 text-[11px]">
              <Plus className="size-3.5" /> Aggiungi
            </Button>
          </div>
          {listing.bulletPoints.map((bullet, index) => (
            <div key={`bullet-${index}`} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-[11px] text-muted-foreground">{index + 1}.</span>
              <Input
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                placeholder="Es. IMPERMEABILE — tessuto ripstop trattato per la pioggia"
                className="h-9 text-xs"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 px-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeBullet(index)}
                disabled={listing.bulletPoints.length <= 1}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Descrizione */}
        <div className="space-y-1.5">
          <Label htmlFor="am-desc">Descrizione prodotto ({listing.description.length} caratteri)</Label>
          <Textarea
            id="am-desc"
            rows={8}
            value={listing.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Descrizione estesa del prodotto, uso, materiali, punti di forza..."
          />
        </div>

        {/* Search terms */}
        <div className="space-y-1.5">
          <Label htmlFor="am-search">Search term / keyword backend</Label>
          <Textarea
            id="am-search"
            rows={3}
            value={listing.searchTerms}
            onChange={(e) => update({ searchTerms: e.target.value })}
            placeholder="Parole chiave separate da spazio, senza ripetere brand o categoria già indicati"
          />
        </div>

        {/* Immagini — solo URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">
              Immagini ({imageCount})
            </Label>
            <Button variant="ghost" size="sm" onClick={addImage} className="h-7 gap-1 px-2 text-[11px]">
              <Plus className="size-3.5" /> Aggiungi
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Incolla l'URL pubblico di ogni immagine (es. link a un file già caricato altrove). Nessun upload diretto.
          </p>
          <div className="space-y-3">
            {listing.images.map((img, index) => (
              <div key={img.id} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3">
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.alt || `Anteprima immagine ${index + 1}`}
                    className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                    <ImageOff className="size-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={img.url}
                    onChange={(e) => updateImage(img.id, { url: e.target.value })}
                    placeholder="https://…/immagine.jpg"
                    className="h-9 text-xs"
                  />
                  <Input
                    value={img.alt}
                    onChange={(e) => updateImage(img.id, { alt: e.target.value })}
                    placeholder="Testo alternativo (opzionale)"
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 px-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeImage(img.id)}
                  disabled={listing.images.length <= 1}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Specifiche personalizzate illimitate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs tracking-wide uppercase text-muted-foreground">
              Specifiche / attributi personalizzati ({specificsCount})
            </Label>
            <Button variant="ghost" size="sm" onClick={addSpecific} className="h-7 gap-1 px-2 text-[11px]">
              <Plus className="size-3.5" /> Aggiungi
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Aggiungi quante specifiche vuoi: materiale, colore, dimensioni, peso, EAN/UPC, garanzia, età consigliata,
            compatibilità... qualsiasi attributo utile alla scheda.
          </p>
          <div className="space-y-2">
            {listing.specifics.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Input
                  value={s.key}
                  onChange={(e) => updateSpecific(s.id, { key: e.target.value })}
                  placeholder="Nome attributo (es. Materiale)"
                  className="h-9 w-1/3 text-xs"
                />
                <Input
                  value={s.value}
                  onChange={(e) => updateSpecific(s.id, { value: e.target.value })}
                  placeholder="Valore (es. Poliestere riciclato 600D)"
                  className="h-9 flex-1 text-xs"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 px-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSpecific(s.id)}
                  disabled={listing.specifics.length <= 1}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------- ANTEPRIMA / EXPORT ---------------------------- */}
      <div className="panel space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Anteprima scheda
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(formatAmazonListingForExport(listing), "Scheda prodotto")}
          >
            <Copy className="mr-1.5 size-4" /> Copia tutto
          </Button>
        </div>

        <Textarea
          readOnly
          rows={24}
          className="font-mono text-xs leading-relaxed"
          value={formatAmazonListingForExport(listing)}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => handleExport("txt")} disabled={exporting}>
            <Download className="mr-2 size-4" /> Esporta .txt
          </Button>
          <Button variant="outline" onClick={() => handleExport("json")} disabled={exporting}>
            <Download className="mr-2 size-4" /> Esporta .json
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ogni esportazione (.txt o .json) consuma 1 credito. La copia rapida dei singoli campi con "Copia tutto" è
          invece sempre gratuita.
        </p>
      </div>
    </div>
  );
}
