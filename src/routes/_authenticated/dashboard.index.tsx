import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  ErrorState,
  InactiveSubscriptionState,
  LoadingState,
} from "@/components/dashboard/StateBanners";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { planAllowsTool } from "@/config/plans";
import { TOOLS } from "@/config/tools";
import { useAccount } from "@/hooks/useAccount";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — OP+studioKdp" },
      { name: "description", content: "I tuoi tool KDP, crediti e utilizzo mensile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const account = useAccount();
  const state = account.data?.credits;

  const isAllowed = (toolId: string) =>
    state?.allowed_tools ? state.allowed_tools.includes(toolId) : planAllowsTool(state?.plan?.slug, toolId);

  return (
    <DashboardShell title="Dashboard" description="Tutti i tuoi strumenti in un unico posto">
      <div className="mx-auto max-w-6xl space-y-8">
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

        {state?.active && (
          <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
            <CreditsCard state={state} />
            <div className="panel space-y-2 p-6">
              <p className="text-sm text-muted-foreground">Piano attivo</p>
              <p className="text-xl font-bold">{state.plan?.name ?? "—"}</p>
              {state.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  Rinnovo il{" "}
                  {new Date(state.current_period_end).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link to="/dashboard/subscription">Gestisci abbonamento</Link>
              </Button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            I tuoi tool
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TOOLS.map((tool) => {
              const allowed = !state || isAllowed(tool.id);
              return (
                <div key={tool.id} className="panel flex flex-col gap-4 p-6">
                  <div className="flex items-start gap-4">
                    <ToolIcon tool={tool} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{tool.name}</h3>
                        {!allowed && (
                          <Badge variant="outline" className="gap-1 border-border text-[11px]">
                            <Lock className="size-3" />
                            Pro / Business
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    1 credito — {tool.creditEvent.toLowerCase()}
                  </p>
                  <Button
                    variant={allowed ? "outline" : "ghost"}
                    size="sm"
                    className="mt-auto w-fit"
                    asChild
                  >
                    <Link to={allowed ? tool.route : "/dashboard/subscription"}>
                      {allowed ? "Apri il tool" : "Sblocca con Pro"}
                      <ArrowRight className="ml-1.5 size-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
