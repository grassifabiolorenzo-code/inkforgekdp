import { Check, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_META, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Selettore globale della lingua dell'interfaccia.
 * La scelta è salvata nel browser e vale per tutto il sito (landing + dashboard + tool).
 */
export function LanguageSwitcher({
  className,
  variant = "compact",
}: {
  className?: string;
  variant?: "compact" | "full";
}) {
  const { locale, setLocale, t } = useI18n();
  const current = LOCALE_META[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "compact" ? "icon" : "sm"}
          aria-label={t("lang.interface")}
          className={cn("gap-1.5", className)}
        >
          <Globe className="size-4" />
          {variant === "full" ? (
            <span className="text-sm">{current.native}</span>
          ) : (
            <span className="sr-only">{current.native}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t("lang.interface")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLocale(code)}
            className="flex items-center gap-2"
          >
            <span aria-hidden>{LOCALE_META[code].flag}</span>
            <span className="flex-1">{LOCALE_META[code].native}</span>
            {code === locale && <Check className="size-4 text-accent" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
