import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";

import {
  consumeCredit,
  getAccountState,
  getUsageBreakdown,
  type ConsumeResult,
  type CreditState,
} from "@/lib/credits.functions";
import type { ToolConfig } from "@/config/tools";

export const accountQueryKey = ["account-state"] as const;
export const usageQueryKey = ["usage-breakdown"] as const;

export function useAccount() {
  const fetchState = useServerFn(getAccountState);
  return useQuery({
    queryKey: accountQueryKey,
    queryFn: () => fetchState(),
    staleTime: 15_000,
  });
}

export function useUsageBreakdown() {
  const fetchUsage = useServerFn(getUsageBreakdown);
  return useQuery({ queryKey: usageQueryKey, queryFn: () => fetchUsage() });
}

export type CreditBlock = null | "subscription_inactive" | "limit_reached" | "tool_not_in_plan";

/**
 * Hook centralizzato per il consumo dei crediti.
 * Da usare SOLO al completamento effettivo dell'operazione del tool.
 */
export function useToolCredit(tool: ToolConfig) {
  const queryClient = useQueryClient();
  const consume = useServerFn(consumeCredit);
  const [block, setBlock] = useState<CreditBlock>(null);

  const mutation = useMutation({
    mutationFn: (input: { operationId: string; description?: string }) =>
      consume({
        data: {
          toolId: tool.id,
          operationId: input.operationId,
          action: tool.creditAction,
          description: input.description ?? tool.creditEvent,
        },
      }),
    onSuccess: (result: ConsumeResult) => {
      if (!result.ok && result.reason) setBlock(result.reason);
      queryClient.invalidateQueries({ queryKey: accountQueryKey });
      queryClient.invalidateQueries({ queryKey: usageQueryKey });
    },
  });

  const charge = useCallback(
    async (operationId: string, description?: string) => {
      const result = await mutation.mutateAsync({ operationId, description });
      return result;
    },
    [mutation],
  );

  return {
    charge,
    charging: mutation.isPending,
    block,
    clearBlock: () => setBlock(null),
    setBlock,
  };
}

export function creditsLabel(state: CreditState | undefined) {
  if (!state) return "—";
  if (state.unlimited) return "Utilizzo illimitato";
  return `${state.used} / ${state.limit}`;
}

export function newOperationId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}:${random}`;
}
