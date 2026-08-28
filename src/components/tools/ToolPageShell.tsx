import { Link } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  CreditBlockDialog,
  ErrorState,
  InactiveSubscriptionState,
  LoadingState,
  ToolNotInPlanState,
} from "@/components/dashboard/StateBanners";
import { planAllowsTool } from "@/config/plans";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ToolConfig } from "@/config/tools";
import { useAccount, useToolCredit } from "@/hooks/useAccount";
import type { ConsumeResult, CreditState } from "@/lib/credits.functions";

export interface ToolRuntime {
  /** Scala 1 credito. Da chiamare SOLO al completamento dell'operazione. */
  charge: (operationId: string, description?: string) => Promise<ConsumeResult>;
  charging: boolean;
  /** True se l'utente ha almeno 1 credito disponibile. */
  canOperate: boolean;
  state: CreditState;
  /** Mostra il modal di limite raggiunto senza tentare l'operazione. */
  blockOperation: () => void;
}

/**
 * Guscio comune ai tool: autenticazione, abbonamento, crediti, stati.
 * La logica specifica di ogni tool resta in un modulo indipendente.
 */
export function ToolPageShell({
  tool,
  children,
}: {
  tool: ToolConfig;
  children: (runtime: ToolRuntime) => ReactNode;
}) {
  const account = useAccount();
  const credit = useToolCredit(tool);

  const state = account.data?.credits;

  return (
    <DashboardShell
      title={tool.name}
      description={`1 credito — ${tool.creditEvent.toLowerCase()}`}
      actions={
        state ? (
          <Badge variant="outline" className="gap-1.5 border-border">
            <Coins className="size-3.5 text-accent" />
            {state.unlimited ? "Illimitato" : `${Math.max(state.remaining, 0)} crediti`}
          </Badge>
        ) : null
      }
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="panel flex flex-wrap items-center gap-4 p-5">
          <ToolIcon tool={tool} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{tool.name}</h2>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Torna alla dashboard</Link>
          </Button>
        </div>

        {account.isLoading && <LoadingState />}
        {account.isError && (
          <ErrorState
            message={account.error instanceof Error ? account.error.message : undefined}
            onRetry={() => account.refetch()}
          />
        )}

        {state && !state.active && <InactiveSubscriptionState state={state} />}

        {state?.active &&
          children({
            charge: credit.charge,
            charging: credit.charging,
            canOperate: state.unlimited || state.remaining > 0,
            state,
            blockOperation: () => credit.setBlock("limit_reached"),
          })}

        <CreditBlockDialog
          block={credit.block}
          planSlug={state?.plan?.slug ?? null}
          onClose={credit.clearBlock}
        />
      </div>
    </DashboardShell>
  );
}
