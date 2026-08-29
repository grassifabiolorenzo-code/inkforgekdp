import { AlertTriangle, CheckCircle2, Plus, ShieldCheck, XCircle } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { Listing } from "@/components/tools/pubblicazione/listingLogic";
import { auditListing, auditScore, KDP_LIMITS, suggestKeywords } from "@/components/tools/pubblicazione/seoAudit";

/**
 * Pannello di controllo SEO/KDP mostrato prima di copiare o esportare:
 * conteggio caratteri, check di conformità e suggerimenti keyword long-tail.
 */
export function SeoPanel({
  listing,
  subject,
  onApplyKeyword,
}: {
  listing: Listing;
  subject: string;
  onApplyKeyword: (keyword: string) => void;
}) {
  const checks = useMemo(() => auditListing(listing), [listing]);
  const score = useMemo(() => auditScore(checks), [checks]);
  const suggestions = useMemo(() => suggestKeywords(listing, subject), [listing, subject]);
  const errors = checks.filter((c) => c.level === "error").length;
  const warnings = checks.filter((c) => c.level === "warn").length;

  const counters: { label: string; value: number; max: number }[] = [
    { label: "Titolo", value: listing.title.trim().length, max: KDP_LIMITS.title },
    { label: "Sottotitolo", value: listing.subtitle.trim().length, max: KDP_LIMITS.subtitle },
    { label: "Descrizione", value: listing.description.trim().length, max: KDP_LIMITS.description },
    {
      label: "Keyword",
      value: listing.keywords.filter((k) => k.trim()).length,
      max: 7,
    },
  ];

  return (
    <section className="panel space-y-4 p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-accent" />
            Controllo SEO / conformità KDP
          </h4>
          <p className="text-xs text-muted-foreground">
            {errors > 0
              ? `${errors} problemi bloccanti da correggere prima di pubblicare.`
              : warnings > 0
                ? `Nessun errore bloccante, ${warnings} suggerimenti di ottimizzazione.`
                : "Metadati conformi e ottimizzati: puoi copiare o esportare."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2.5 py-1 text-sm font-bold ${
            errors > 0
              ? "bg-destructive/10 text-destructive"
              : warnings > 0
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {score}/100
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counters.map((c) => {
          const over = c.value > c.max;
          return (
            <div key={c.label} className="rounded-md border border-border bg-surface p-2.5">
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className={`text-sm font-semibold ${over ? "text-destructive" : ""}`}>
                {c.value}
                <span className="text-[11px] font-normal text-muted-foreground"> / {c.max}</span>
              </p>
            </div>
          );
        })}
      </div>

      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs">
            {check.level === "ok" ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
            ) : check.level === "warn" ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
            ) : (
              <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            )}
            <span>
              <strong className="font-medium">{check.label}:</strong>{" "}
              <span className="text-muted-foreground">{check.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <div>
        <p className="text-xs tracking-wide uppercase text-muted-foreground">
          Suggerimenti keyword long-tail (dai tuoi testi)
        </p>
        {suggestions.length === 0 ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Nessun nuovo suggerimento: le frasi ricorrenti sono già nei box keyword.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestions.map((kw) => (
              <Button
                key={kw}
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-[11px]"
                onClick={() => onApplyKeyword(kw)}
              >
                <Plus className="size-3" />
                {kw}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
