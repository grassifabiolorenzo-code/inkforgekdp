import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { upgradePathFrom } from "@/config/plans";
import type { CreditBlock } from "@/hooks/useAccount";
import type { CreditState } from "@/lib/credits.functions";

export function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="panel p-10 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="panel space-y-3 p-8 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" />
      <p className="font-medium">Qualcosa è andato storto</p>
      <p className="text-sm text-muted-foreground">{message ?? "Riprova tra qualche istante."}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Riprova
        </Button>
      )}
    </div>
  );
}

export function InactiveSubscriptionState({ state }: { state?: CreditState }) {
  return (
    <div className="panel-highlight space-y-4 p-8 text-center">
      <span className="icon-tile mx-auto size-12">
        <Lock className="size-5 text-accent" />
      </span>
      <h2 className="text-lg font-semibold">
        {state?.has_subscription ? "Abbonamento non attivo" : "Nessun abbonamento attivo"}
      </h2>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Attiva un piano per usare i tool. Tutti i piani includono tutti e 4 gli strumenti: cambia
        solo il numero di utilizzi mensili.
      </p>
      <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
        <Link to="/dashboard/subscription">Vedi i piani</Link>
      </Button>
    </div>
  );
}

/** Modal mostrato quando il limite mensile è esaurito. */
export function CreditBlockDialog({
  block,
  planSlug,
  onClose,
}: {
  block: CreditBlock;
  planSlug?: string | null;
  onClose: () => void;
}) {
  const upgrades = upgradePathFrom(planSlug);
  const nextPlan = upgrades[0];

  const isLimit = block === "limit_reached";
  const planName = planSlug === "pro" ? "Pro" : planSlug === "starter" ? "Starter" : "attuale";

  return (
    <Dialog open={block !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLimit ? "Hai esaurito i tuoi crediti mensili" : "Abbonamento non attivo"}
          </DialogTitle>
          <DialogDescription>
            {isLimit
              ? `Hai raggiunto il limite mensile del piano ${planName}. I crediti si rinnovano al prossimo periodo di fatturazione.`
              : "Per eseguire questa operazione è necessario un abbonamento attivo."}
          </DialogDescription>
        </DialogHeader>

        {isLimit && upgrades.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Alternative disponibili:</p>
            {upgrades.map((plan) => (
              <div
                key={plan.slug}
                className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{plan.name}</span> — €{plan.price}/mese ·{" "}
                  {plan.unlimited ? "illimitato" : `${plan.monthlyLimit} utilizzi`}
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Chiudi
          </Button>
          <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
            <Link to="/dashboard/subscription">
              {nextPlan ? `Passa a ${nextPlan.name}` : "Gestisci abbonamento"}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
