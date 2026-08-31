import { createFileRoute } from "@tanstack/react-router";

import { CreditsCard } from "@/components/dashboard/CreditsCard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState, LoadingState } from "@/components/dashboard/StateBanners";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { TOOLS } from "@/config/tools";
import { useAccount, useUsageBreakdown } from "@/hooks/useAccount";
import { useI18n, useToolCopy } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/usage")({
  head: () => ({
    meta: [
      { title: "Utilizzo — InkForgeKdp" },
      { name: "description", content: "Storico e ripartizione dei crediti usati per tool." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsagePage,
});

function UsagePage() {
  const account = useAccount();
  const usage = useUsageBreakdown();
  const { t } = useI18n();
  const copyOf = useToolCopy();
  const state = account.data?.credits;

  return (
    <DashboardShell title={t("dash.usage")} description="Come stai consumando i tuoi crediti">
      <div className="mx-auto max-w-4xl space-y-8">
        {state && <CreditsCard state={state} />}

        <div className="panel p-6">
          <h2 className="font-semibold">{t("dash.tools")}</h2>
          <div className="mt-4 space-y-3">
            {TOOLS.map((tool) => (
              <div key={tool.id} className="flex items-center gap-3">
                <ToolIcon tool={tool} size="sm" />
                <span className="flex-1 text-sm">{copyOf(tool.id).name}</span>
                <span className="text-sm font-semibold">
                  {usage.data?.perTool[tool.id] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="font-semibold">Storico crediti</h2>
          {usage.isLoading && <LoadingState />}
          {!usage.isLoading && (usage.data?.history.length ?? 0) === 0 && (
            <EmptyState
              title="Nessun utilizzo ancora"
              description="I crediti vengono scalati solo al completamento di un'operazione."
            />
          )}
          {(usage.data?.history.length ?? 0) > 0 && (
            <ul className="mt-4 divide-y divide-border text-sm">
              {usage.data?.history.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate">{row.description ?? row.tool_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("it-IT")} · {row.source}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">{row.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
