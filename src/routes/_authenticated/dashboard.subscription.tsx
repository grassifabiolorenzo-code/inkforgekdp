import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { CreditsCard } from "@/components/dashboard/CreditsCard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LoadingState } from "@/components/dashboard/StateBanners";
import { PricingSection } from "@/components/pricing/PricingSection";
import { Button } from "@/components/ui/button";
import type { PlanSlug } from "@/config/plans";
import { useAccount } from "@/hooks/useAccount";
import {
  cancelMySubscription,
  changePlan,
  createCheckout,
  getManageSubscriptionUrl,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({
  head: () => ({
    meta: [
      { title: "Il mio abbonamento — OP+studioKdp" },
      { name: "description", content: "Gestisci piano, rinnovo e metodo di pagamento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const account = useAccount();
  const state = account.data?.credits;
  const checkout = useServerFn(createCheckout);
  const manage = useServerFn(getManageSubscriptionUrl);
  const cancel = useServerFn(cancelMySubscription);
  const switchPlan = useServerFn(changePlan);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSelect(slug: PlanSlug) {
    setLoadingPlan(slug);
    try {
      // Abbonamento già attivo → upgrade/downgrade sulla sottoscrizione esistente.
      if (state?.has_subscription && state.active) {
        const changed = await switchPlan({ data: { planSlug: slug } });
        if (changed.ok) {
          toast.success("Piano aggiornato. Lo stato si sincronizza in pochi secondi.");
          await account.refetch();
          return;
        }
        if (changed.reason === "variant_not_configured") {
          toast.error("Piano non ancora collegato a Lemon Squeezy.");
          return;
        }
      }
      const result = await checkout({
        data: { planSlug: slug, redirectUrl: `${window.location.origin}/dashboard/subscription` },
      });
      if (result.url) window.location.href = result.url;
      else toast.error(result.error ?? "Checkout non disponibile al momento.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout non riuscito");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleManage() {
    setBusy(true);
    try {
      const result = await manage({});
      if (result.url) window.location.href = result.url;
      else toast.error("Nessun abbonamento attivo da gestire.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operazione non riuscita");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Confermi la disdetta dell'abbonamento?")) return;
    setBusy(true);
    try {
      const result = await cancel({});
      if (result.ok) toast.success("Disdetta registrata. Resterà attivo fino a fine periodo.");
      else toast.error("Nessun abbonamento da disdire.");
      await account.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operazione non riuscita");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="Il mio abbonamento" description="Piano, crediti e pagamenti">
      <div className="mx-auto max-w-6xl space-y-8">
        {account.isLoading && <LoadingState />}

        {state?.has_subscription && (
          <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <CreditsCard state={state} />
            <div className="panel space-y-3 p-6">
              <p className="text-sm text-muted-foreground">Stato</p>
              <p className="text-xl font-bold">
                {state.plan?.name ?? "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">({state.status})</span>
              </p>
              {state.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  Periodo corrente fino al{" "}
                  {new Date(state.current_period_end).toLocaleDateString("it-IT")}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleManage} disabled={busy}>
                  Gestisci pagamento
                </Button>
                {state.active && !state.cancelled_at && (
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={busy}>
                    Disdici
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <PricingSection
          compact
          onSelect={handleSelect}
          currentPlan={state?.plan?.slug ?? null}
          loadingPlan={loadingPlan}
        />
      </div>
    </DashboardShell>
  );
}
