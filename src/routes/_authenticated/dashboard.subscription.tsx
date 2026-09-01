import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
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
  createCreditPackCheckout,
  getBillingStatus,
  getManageSubscriptionUrl,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({
  head: () => ({
    meta: [
      { title: "Il mio abbonamento — InkForgeKdp" },
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
  const creditPackCheckout = useServerFn(createCreditPackCheckout);
  const manage = useServerFn(getManageSubscriptionUrl);
  const cancel = useServerFn(cancelMySubscription);
  const switchPlan = useServerFn(changePlan);
  const billingStatusFn = useServerFn(getBillingStatus);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [buyingCreditPack, setBuyingCreditPack] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Stato configurazione pagamenti letto dal server: disabilita solo il checkout.
  const billingStatus = useQuery({
    queryKey: ["billing-status"],
    queryFn: () => billingStatusFn(),
    staleTime: 60_000,
  });
  const unavailablePlans = billingStatus.data
    ? (["starter", "pro", "business"] as const).filter(
        (slug) =>
          !billingStatus.data.apiKey ||
          !billingStatus.data.storeId ||
          !billingStatus.data.variants[slug],
      )
    : [];

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

  async function handleBuyCreditPack() {
    setBuyingCreditPack(true);
    try {
      const result = await creditPackCheckout({
        data: { redirectUrl: `${window.location.origin}/dashboard/subscription` },
      });
      if (result.url) window.location.href = result.url;
      else toast.error(result.error ?? "Checkout non disponibile al momento.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout non riuscito");
    } finally {
      setBuyingCreditPack(false);
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
      setCancelOpen(false);
    }
  }

  return (
    <DashboardShell title="Il mio abbonamento" description="Piano, crediti e pagamenti">
      <div className="mx-auto max-w-6xl space-y-8">
        {account.isLoading && <LoadingState />}

        {state?.has_subscription && (
          <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <CreditsCard
              state={state}
              onBuyCreditPack={handleBuyCreditPack}
              buyingCreditPack={buyingCreditPack}
              creditPackAvailable={billingStatus.data?.creditPackReady}
            />
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
                  Metodo di pagamento e fatture
                </Button>
                {state.active && !state.cancelled_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCancelOpen(true)}
                    disabled={busy}
                  >
                    Disdici
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Da "Metodo di pagamento e fatture" puoi anche scaricare le ricevute dei pagamenti
                passati.
              </p>
            </div>
          </div>
        )}

        {billingStatus.data && !billingStatus.data.ready && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              I pagamenti sono in fase di attivazione: al momento non è possibile avviare o
              modificare un abbonamento. Il resto della dashboard resta pienamente utilizzabile.
            </p>
          </div>
        )}

        <PricingSection
          compact
          onSelect={handleSelect}
          currentPlan={state?.plan?.slug ?? null}
          loadingPlan={loadingPlan}
          disabledPlans={unavailablePlans}
        />
      </div>

      <ConfirmDangerDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Disdire l'abbonamento?"
        description="Resterà attivo fino alla fine del periodo già pagato, poi non si rinnoverà. Potrai riattivarlo in qualsiasi momento prima della scadenza."
        confirmWord="DISDICI"
        actionLabel="Disdici abbonamento"
        onConfirm={handleCancel}
        pending={busy}
      />
    </DashboardShell>
  );
}
