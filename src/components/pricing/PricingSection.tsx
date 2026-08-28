import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanSlug } from "@/config/plans";
import { cn } from "@/lib/utils";

export function PricingSection({
  onSelect,
  currentPlan,
  loadingPlan,
  compact = false,
}: {
  onSelect?: (slug: PlanSlug) => void;
  currentPlan?: string | null;
  loadingPlan?: string | null;
  compact?: boolean;
}) {
  return (
    <section id="pricing" className={cn("mx-auto max-w-6xl px-4", compact ? "py-8" : "py-20")}>
      {!compact && (
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="border-border bg-gradient-brand-soft text-foreground">
            Prezzi trasparenti
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Scegli il tuo <span className="text-gradient">piano mensile</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Tutti i piani includono tutti e 4 i tool. Nessun vincolo: cancelli quando vuoi.
          </p>
        </div>
      )}

      <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.slug;
          return (
            <div
              key={plan.slug}
              className={cn(
                "relative flex flex-col gap-6 p-7",
                plan.recommended ? "panel-highlight lg:-mt-4 lg:pb-10 glow-violet" : "panel",
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "absolute -top-3 left-7 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide",
                    plan.recommended
                      ? "badge-gradient"
                      : "border border-border bg-surface-elevated text-muted-foreground",
                  )}
                >
                  {plan.badge}
                </span>
              )}

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </div>

              <div className="flex items-end gap-1">
                <span className="text-4xl font-black tracking-tight">€{plan.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">/mese</span>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3 text-sm">
                {plan.unlimited ? (
                  <p className="font-semibold text-accent">UTILIZZO ILLIMITATO</p>
                ) : (
                  <p>
                    <span className="font-semibold text-foreground">{plan.monthlyLimit}</span>{" "}
                    <span className="text-muted-foreground">utilizzi al mese</span>
                  </p>
                )}
                {plan.firstMonthBonus > 0 && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-accent">
                    <Sparkles className="size-3.5" />+{plan.firstMonthBonus} utilizzi bonus il primo
                    mese
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Piano attivo
                  </Button>
                ) : onSelect ? (
                  <Button
                    className={cn(
                      "w-full",
                      plan.recommended && "bg-gradient-brand text-primary-foreground hover:opacity-90",
                    )}
                    variant={plan.recommended ? "default" : "outline"}
                    disabled={loadingPlan === plan.slug}
                    onClick={() => onSelect(plan.slug)}
                  >
                    {loadingPlan === plan.slug ? "Apertura checkout…" : `Scegli ${plan.name}`}
                  </Button>
                ) : (
                  <Button
                    asChild
                    className={cn(
                      "w-full",
                      plan.recommended && "bg-gradient-brand text-primary-foreground hover:opacity-90",
                    )}
                    variant={plan.recommended ? "default" : "outline"}
                  >
                    <Link to="/auth" search={{ mode: "signup", plan: plan.slug }}>
                      Scegli {plan.name}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
