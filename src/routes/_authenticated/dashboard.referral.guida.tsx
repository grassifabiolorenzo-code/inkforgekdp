import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Gift, TrendingDown, Users } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";
import {
  calcReferralPrice,
  maxDiscountReferrals,
  NEW_USER_FIRST_MONTH_DISCOUNT_PERCENT,
  REFERRAL_CYCLE_BONUS_CREDITS,
  REFERRAL_CYCLE_LENGTH,
  REFERRAL_CYCLE_TOTAL_CREDITS,
  REFERRAL_DISCOUNT_PER_STEP,
  REFERRAL_LEVEL_REWARDS,
  REFERRAL_REFERRALS_PER_STEP,
} from "@/config/referral";

export const Route = createFileRoute("/_authenticated/dashboard/referral/guida")({
  head: () => ({
    meta: [
      { title: "Come funziona il referral — InkForgeKdp" },
      {
        name: "description",
        content: "Come funzionano lo sconto per chi porti e la riduzione del tuo abbonamento.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReferralGuidePage,
});

function ReferralGuidePage() {
  return (
    <DashboardShell
      title="Come funziona il referral"
      description="Due vantaggi separati, entrambi legati a quante persone porti attivamente"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="panel space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-accent" />
            <h2 className="font-semibold">In breve</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Condividi il tuo link personale (lo trovi nella pagina{" "}
            <Link to="/dashboard/referral" className="underline hover:text-foreground">
              Referral
            </Link>
            ). Chi si abbona passando da lì ottiene subito uno sconto; tu, per ogni abbonato attivo
            che porti, guadagni su due fronti indipendenti: il costo del tuo piano scende, e
            accumuli crediti extra utilizzabili in tutti i tool.
          </p>
        </div>

        {/* 1. Chi porti */}
        <section className="panel space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-accent" />
            <h2 className="font-semibold">1. Chi inviti risparmia subito</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Chiunque si abboni (Starter, Pro o Business) tramite il tuo link ottiene il{" "}
            <span className="font-semibold text-foreground">
              {NEW_USER_FIRST_MONTH_DISCOUNT_PERCENT}% di sconto
            </span>{" "}
            sul primo mese, qualunque piano scelga.
          </p>
        </section>

        {/* 2. Riduzione prezzo */}
        <section className="panel space-y-4 p-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="size-5 text-accent" />
            <h2 className="font-semibold">2. Il tuo abbonamento costa sempre meno</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Ogni{" "}
            <span className="font-semibold text-foreground">
              {REFERRAL_REFERRALS_PER_STEP} abbonati paganti attivi
            </span>{" "}
            che hai portato riducono il canone del tuo piano di{" "}
            <span className="font-semibold text-foreground">
              €{REFERRAL_DISCOUNT_PER_STEP}/mese
            </span>
            , fino ad arrivare a <span className="font-semibold text-foreground">€0/mese</span> —
            indipendentemente dal piano scelto. Vale per Starter, Pro e Business allo stesso modo.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Piano</th>
                  <th className="p-3 text-left">Prezzo pieno</th>
                  <th className="p-3 text-left">
                    Con {REFERRAL_REFERRALS_PER_STEP} referral attivi
                  </th>
                  <th className="p-3 text-left">A costo zero da</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {/* Tutti e 3 i piani: "unlimited" su Business riguarda i crediti mensili, non lo
                    sconto referral, che si applica a Starter/Pro/Business allo stesso modo. */}
                {PLANS.map((plan) => (
                  <tr key={plan.slug}>
                    <td className="p-3 font-medium text-foreground">{plan.name}</td>
                    <td className="p-3 text-muted-foreground">€{plan.price}/mese</td>
                    <td className="p-3 text-muted-foreground">
                      €{calcReferralPrice(plan.price, REFERRAL_REFERRALS_PER_STEP)}/mese
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {maxDiscountReferrals(plan.price)} referral attivi
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            "Attivo" significa che l'abbonato ha un pagamento in corso in questo momento: se il suo
            abbonamento finisce o viene cancellato, il tuo prezzo si ricalcola automaticamente sul
            nuovo numero di referral attivi (può quindi anche risalire).
          </p>
        </section>

        {/* 3. Ciclo crediti */}
        <section className="panel space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Award className="size-5 text-accent" />
            <h2 className="font-semibold">3. Ogni referral ti dà anche crediti, a parte</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Indipendentemente dallo sconto sul canone, ogni nuovo abbonato attivo che porti ti fa
            avanzare in un ciclo di {REFERRAL_CYCLE_LENGTH} posizioni: più avanti sei nel ciclo, più
            crediti vale il prossimo referral. Completare tutte le {REFERRAL_CYCLE_LENGTH} posizioni
            dà un bonus extra, poi il ciclo riparte da capo.
          </p>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {REFERRAL_LEVEL_REWARDS.map((credits, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-md border border-border p-2 text-center"
              >
                <span className="text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <span className="text-[10px] text-muted-foreground">{credits}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            + un bonus di{" "}
            <span className="font-semibold text-foreground">
              {REFERRAL_CYCLE_BONUS_CREDITS.toLocaleString("it-IT")} crediti
            </span>{" "}
            al completamento del ciclo — fino a{" "}
            <span className="font-semibold text-foreground">
              {REFERRAL_CYCLE_TOTAL_CREDITS.toLocaleString("it-IT")} crediti
            </span>{" "}
            se porti {REFERRAL_CYCLE_LENGTH} abbonati attivi in un solo ciclo. Poi si riparte dal
            livello 1, da capo, ogni volta.
          </p>
        </section>

        {/* Esempio */}
        <section className="panel space-y-3 p-6">
          <h2 className="font-semibold">Un esempio concreto</h2>
          <p className="text-sm text-muted-foreground">
            Hai il piano Pro (€35/mese) e hai portato 12 abbonati attivi:
          </p>
          <ul className="ml-4 list-disc space-y-1.5 text-sm text-muted-foreground">
            <li>
              12 referral ÷ {REFERRAL_REFERRALS_PER_STEP} = 2 scatti completi → il tuo Pro costa{" "}
              <Badge variant="secondary" className="mx-1">
                €{calcReferralPrice(35, 12)}/mese
              </Badge>{" "}
              invece di €35.
            </li>
            <li>
              Nel ciclo crediti sei al 2° giro (12 = 1 ciclo completo da {REFERRAL_CYCLE_LENGTH} +
              2): hai già incassato il bonus ciclo da{" "}
              {REFERRAL_CYCLE_BONUS_CREDITS.toLocaleString("it-IT")} crediti, più tutti i crediti
              dei primi {REFERRAL_CYCLE_LENGTH} referral, e sei al livello 2 del nuovo ciclo.
            </li>
          </ul>
        </section>

        <div className="flex justify-center">
          <Button asChild>
            <Link to="/dashboard/referral">
              <Gift className="mr-1.5 size-4" />
              Vai al tuo link referral
            </Link>
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
