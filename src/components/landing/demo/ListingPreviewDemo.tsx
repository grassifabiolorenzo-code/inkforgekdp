import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defaultAgeDetails,
  generateListing,
  type Audience,
  type BookType,
} from "@/components/tools/pubblicazione/listingLogic";

const BOOK_TYPES: { id: BookType; label: string }[] = [
  { id: "coloring", label: "Coloring Book" },
  { id: "activity", label: "Activity Book" },
  { id: "notebook", label: "Quaderno Speciale" },
  { id: "exercise", label: "Quaderno Didattico" },
];

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "toddlers", label: "Bambini (2-8 anni)" },
  { id: "teens", label: "Ragazzi (9-14 anni)" },
  { id: "adults", label: "Adulti" },
];

const VISIBLE_CHARS = 190;

/**
 * Anteprima gratuita, senza login, del tool Pubblicazione: motore locale (nessuna AI, nessuna
 * chiamata server) usato solo per mostrare titolo/sottotitolo. La descrizione viene troncata e
 * sfumata, keyword e categorie restano nascoste: il testo completo richiede un abbonamento.
 */
export function ListingPreviewDemo() {
  const [subject, setSubject] = useState("Dinosauri");
  const [bookType, setBookType] = useState<BookType>("coloring");
  const [audience, setAudience] = useState<Audience>("toddlers");

  const listing = useMemo(
    () =>
      generateListing({
        locale: "it",
        subject,
        bookType,
        audience,
        ageDetails: defaultAgeDetails(audience),
        hasCover: true,
        hasInterior: true,
        interiorScanned: true,
        interiorPages: 60,
      }),
    [subject, bookType, audience],
  );

  const truncated = listing.description.slice(0, VISIBLE_CHARS);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr] md:items-start">
      <div className="space-y-4">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-accent" /> Tool 2 — Pubblicazione
        </p>
        <h3 className="text-2xl font-bold">
          Da un soggetto a un <span className="text-gradient">listing pronto</span> in un istante
        </h3>
        <p className="text-sm text-muted-foreground">
          Nell'app il testo viene scritto analizzando davvero copertina e pagine interne del tuo
          libro (SEO + AIDA + PAS). Qui sotto un'anteprima istantanea con il motore base, per farti
          vedere la struttura.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="demo-subject">Soggetto del libro</Label>
          <Input
            id="demo-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Es. Dinosauri"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="demo-book-type">Tipo di libro</Label>
            <Select value={bookType} onValueChange={(v) => setBookType(v as BookType)}>
              <SelectTrigger id="demo-book-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOK_TYPES.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-audience">Pubblico</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <SelectTrigger id="demo-audience">
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
        </div>
        <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
          <Link to="/pricing">
            <Lock className="mr-2 size-4" /> Sblocca testo completo, keyword e categorie
          </Link>
        </Button>
      </div>

      <div className="panel space-y-4 p-6">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Titolo</p>
          <p className="text-lg font-bold">{listing.title}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sottotitolo</p>
          <p className="text-sm text-muted-foreground">{listing.subtitle}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Descrizione</p>
          <div className="relative">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {truncated}
              <span aria-hidden className="select-none blur-[3px]">
                {listing.description.slice(VISIBLE_CHARS, VISIBLE_CHARS + 220)}
              </span>
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(var(--card))] to-transparent" />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-surface p-3 text-xs text-muted-foreground">
          <Lock className="size-3.5 shrink-0" />7 keyword backend e 3 categorie BISAC generate —
          visibili con un abbonamento attivo.
        </div>
      </div>
    </div>
  );
}
