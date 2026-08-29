import { Languages } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES, LOCALE_META, useI18n, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Selettore della lingua dei contenuti generati da un tool.
 * Il valore è condiviso da tutti i tool (persistito nel browser) ma resta
 * indipendente dalla lingua dell'interfaccia.
 * `supported` limita le lingue realmente disponibili per quel tool.
 */
export function OutputLanguageSelect({
  supported,
  className,
  id = "output-language",
}: {
  supported?: readonly Locale[];
  className?: string;
  id?: string;
}) {
  const { outputLocale, setOutputLocale, t } = useI18n();
  const available = supported ?? LOCALES;
  const unsupported = !available.includes(outputLocale);

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs">
        <Languages className="size-3.5 text-accent" />
        {t("output.label")}
      </Label>
      <Select value={outputLocale} onValueChange={(value) => setOutputLocale(value as Locale)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((code) => (
            <SelectItem key={code} value={code} disabled={!available.includes(code)}>
              <span className="mr-1.5" aria-hidden>
                {LOCALE_META[code].flag}
              </span>
              {LOCALE_META[code].native}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-[11px] text-muted-foreground">
        {unsupported ? t("output.notSupported") : t("output.hint")}
      </p>
    </div>
  );
}

/** Lingua effettiva da usare per generare i contenuti di un tool. */
export function useOutputLanguage(supported?: readonly Locale[]): Locale {
  const { outputLocale } = useI18n();
  if (!supported || supported.includes(outputLocale)) return outputLocale;
  return "en";
}
