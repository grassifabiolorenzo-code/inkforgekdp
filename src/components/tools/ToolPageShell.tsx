import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
import { checkToolAccess, type ConsumeResult, type CreditState } from "@/lib/credits.functions";

export interface ToolRuntime {
  /** Scala 1 credito. Da chiamare SOLO al completamento dell'operazione. */
  charge: (operationId: string, description?: string) => Promise<ConsumeResult>;
  charging: boolean;
  /** True se l'utente ha almeno 1 credito disponibile. */
  canOperate: boolean;
  state: CreditState;
  /** Mostra il modal di limite raggiunto senza tentare l'operazione. */
  blockOperation: () => void;
  /**
   * Verifica server-side (piano + crediti) prima di avviare l'operazione.
   * Ritorna false e mostra il blocco se l'utente non è autorizzato.
   */
  ensureAccess: () => Promise<boolean>;
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
  const verifyAccess = useServerFn(checkToolAccess);

  // Gating server-side: la decisione finale non arriva mai dal frontend.
  const ensureAccess = async () => {
    try {
      const result = await verifyAccess({ data: { toolId: tool.id } });
      if (!result.allowed) {
        credit.setBlock(result.reason ?? "limit_reached");
        return false;
      }
      return true;
    } catch {
      credit.setBlock("limit_reached");
      return false;
    }
  };

  const state = account.data?.credits;

  // Il piano include questo tool? (fonte di verità: allowed_tools dal database)
  const toolIncluded = state
    ? (state.allowed_tools
        ? state.allowed_tools.includes(tool.id)
        : planAllowsTool(state.plan?.slug, tool.id))
    : false;

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
            onRetry={() => {
              void account.refetch();
            }}
          />
        )}

        {state && !state.active && <InactiveSubscriptionState state={state} />}

        {state?.active && !toolIncluded && <ToolNotInPlanState toolName={tool.name} />}

        {state?.active &&
          toolIncluded &&
          children({
            charge: credit.charge,
            charging: credit.charging,
            canOperate: state.unlimited || state.remaining > 0,
            state,
            blockOperation: () => credit.setBlock("limit_reached"),
            ensureAccess,
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
