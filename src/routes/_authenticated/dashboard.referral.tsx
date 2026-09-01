import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Gift } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LoadingState } from "@/components/dashboard/StateBanners";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRO_REFERRAL_DISCLAIMER, REFERRAL_LEVEL_REWARDS } from "@/config/referral";
import { getMyReferralDashboard } from "@/lib/referral.functions";

export const Route = createFileRoute("/_authenticated/dashboard/referral")({
  head: () => ({
    meta: [
      { title: "Referral — InkForgeKdp" },
      {
        name: "description",
        content: "Invita altri self-publisher e riduci il costo del tuo Pro.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReferralPage,
});

function ReferralPage() {
  const fetchDashboard = useServerFn(getMyReferralDashboard);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-referral-dashboard"],
    queryFn: () => fetchDashboard(),
  });
  const [copied, setCopied] = useState(false);

  const referralUrl = data?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${data.referral_code}`
    : "";

  async function handleCopy() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Link copiato");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copia non riuscita: seleziona e copia manualmente il link");
    }
  }

  return (
    <DashboardShell
      title="Referral"
      description="Invita altri self-publisher e riduci il costo del tuo Pro"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {isLoading && <LoadingState />}
        {isError && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Impossibile caricare i dati del referral.
          </p>
        )}

        {data && (
          <>
            {/* CTA: link personale */}
            <div className="panel space-y-3 p-6">
              <div className="flex items-center gap-2">
                <Gift className="size-5 text-accent" />
                <h2 className="font-semibold">Il tuo link referral</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Ogni persona che si abbona tramite questo link ottiene il 30% di sconto sul primo
                mese. Tu ottieni crediti e riduci il costo del tuo Pro.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={referralUrl} className="font-mono text-sm" />
                <Button onClick={handleCopy} variant="outline" className="shrink-0">
                  {copied ? (
                    <Check className="mr-1.5 size-4" />
                  ) : (
                    <Copy className="mr-1.5 size-4" />
                  )}
                  {copied ? "Copiato" : "Copia"}
                </Button>
              </div>
            </div>

            {/* Progressione Pro */}
            <div className="panel space-y-4 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">Il tuo Pro</h2>
                <Badge variant={data.current_price === 0 ? "default" : "secondary"}>
                  €{data.current_price}/mese
                </Badge>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {data.active_direct_referrals} / {data.max_discount_referrals}
                  </span>
                  <span className="text-muted-foreground">abbonati paganti attivi</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all"
                    style={{
                      width: `${Math.min(100, (data.active_direct_referrals / data.max_discount_referrals) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {data.next_threshold !== null ? (
                <p className="text-sm text-muted-foreground">
                  Porta altri{" "}
                  <span className="font-semibold text-foreground">
                    {data.referrals_needed_for_next}
                  </span>{" "}
                  abbonati per ridurre il tuo Pro a{" "}
                  <span className="font-semibold text-foreground">€{data.next_price}/mese</span>.
                </p>
              ) : (
                <p className="text-sm font-medium text-accent">
                  Hai raggiunto il livello massimo: il tuo Pro costa €0/mese finché mantieni almeno{" "}
                  {data.max_discount_referrals} abbonati paganti attivi.
                </p>
              )}
            </div>

            {/* Progressione ciclo crediti */}
            <div className="panel space-y-4 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">Ciclo crediti #{data.current_cycle_number}</h2>
                <span className="text-sm text-muted-foreground">
                  {data.current_cycle_progress} / {data.cycle_length}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {REFERRAL_LEVEL_REWARDS.map((credits, i) => {
                  const level = i + 1;
                  const reached = level <= data.current_cycle_progress;
                  return (
                    <div
                      key={level}
                      className={`flex flex-col items-center gap-1 rounded-md border p-2 text-center ${
                        reached ? "border-accent bg-accent/10" : "border-border"
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold ${reached ? "text-accent" : "text-muted-foreground"}`}
                      >
                        {level}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{credits}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Completa il ciclo (10 abbonati) per un bonus extra di 1.000 crediti. Al termine il
                ciclo riparte automaticamente dal livello 1.
              </p>
            </div>

            {/* Storico */}
            <div className="panel space-y-3 p-6">
              <h2 className="font-semibold">I tuoi referral ({data.total_referrals})</h2>
              {data.active_referrals_list.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessun referral ancora. Condividi il tuo link per iniziare.
                </p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {data.active_referrals_list.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <span>{r.referred_email ?? "—"}</span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline">{r.status}</Badge>
                        {new Date(r.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Disclaimer */}
            <details className="panel p-6 text-sm text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">
                Come funziona lo sconto Pro da referral
              </summary>
              <p className="mt-3 whitespace-pre-line">{PRO_REFERRAL_DISCLAIMER}</p>
            </details>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
