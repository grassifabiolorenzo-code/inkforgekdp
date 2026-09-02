import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  deleteGeneration,
  listMyGenerations,
  saveGeneration,
  type GenerationToolId,
} from "@/lib/generations.functions";

export type GenerationRow<TInput = unknown, TOutput = unknown> = {
  id: string;
  tool_id: string;
  title: string;
  locale: string;
  input: TInput;
  output: TOutput;
  created_at: string;
};

/**
 * Cronologia delle generazioni per un singolo tool: la query resta disattivata
 * finché il pannello non viene aperto (enabled: false di default) per non
 * caricare la cronologia di ogni tool a ogni render della pagina — la apre
 * chi la usa davvero.
 */
export function useGenerationHistory<TInput = unknown, TOutput = unknown>(
  toolId: GenerationToolId,
) {
  const queryClient = useQueryClient();
  const fetchList = useServerFn(listMyGenerations);
  const save = useServerFn(saveGeneration);
  const remove = useServerFn(deleteGeneration);

  const queryKey = ["generations", toolId];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () =>
      (await fetchList({ data: { toolId } })) as unknown as GenerationRow<TInput, TOutput>[],
    enabled: false,
  });

  async function saveEntry(entry: {
    title: string;
    locale: string;
    input: TInput;
    output: TOutput;
  }) {
    await save({ data: { toolId, ...entry } });
    void queryClient.invalidateQueries({ queryKey });
  }

  async function removeEntry(id: string) {
    await remove({ data: { id } });
    void queryClient.invalidateQueries({ queryKey });
  }

  return {
    entries: data ?? [],
    isLoading,
    load: refetch,
    saveEntry,
    removeEntry,
  };
}

export type UseGenerationHistoryReturn<TInput = unknown, TOutput = unknown> = ReturnType<
  typeof useGenerationHistory<TInput, TOutput>
>;
