import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminAnalytics, getAdminDashboard } from "@/lib/admin/dashboard.functions";

export const Route = createFileRoute("/_admin/admin/analytics")({
  head: () => ({
    meta: [{ title: "Analytics — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAnalyticsPage,
});

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function AdminAnalyticsPage() {
  const fetchAnalytics = useServerFn(getAdminAnalytics);
  const fetchDashboard = useServerFn(getAdminDashboard);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAnalytics(),
  });
  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ["admin-dashboard", 30],
    queryFn: () => fetchDashboard({ data: { days: 30 } }),
  });

  const isLoading = loadingAnalytics || loadingDashboard;

  return (
    <AdminShell
      title="Analytics"
      description="Metriche di prodotto e revenue"
      breadcrumb={["Admin", "Analytics"]}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        {isLoading || !analytics || !dashboard ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="DAU" value={String(dashboard.activeUsers.dau)} />
            <StatCard label="WAU" value={String(dashboard.activeUsers.wau)} />
            <StatCard label="MAU" value={String(dashboard.activeUsers.mau)} />
            <StatCard label="ARPU (piani attivi)" value={`€${analytics.arpu}`} />
            <StatCard label="Churn (30gg)" value={`${analytics.churn_30d}%`} />
            <StatCard
              label="Conversione trial → paid (30gg)"
              value={`${analytics.trial_to_paid_30d.converted}/${analytics.trial_to_paid_30d.trials_started}`}
            />
            <StatCard label="MRR" value={`€${dashboard.kpis.mrr}`} />
            <StatCard label="ARR" value={`€${dashboard.kpis.mrr * 12}`} />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          LTV non è mostrato: richiede uno storico di pagamenti sufficientemente lungo per essere
          significativo (il ledger pagamenti è stato introdotto ora — tornerà calcolabile con
          qualche mese di dati reali).
        </p>
      </div>
    </AdminShell>
  );
}
