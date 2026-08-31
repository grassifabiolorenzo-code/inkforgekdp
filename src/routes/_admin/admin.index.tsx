import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDashboard } from "@/lib/admin/dashboard.functions";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard admin — InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboardPage,
});

const RANGES = [
  { label: "Oggi", days: 1 },
  { label: "7 giorni", days: 7 },
  { label: "30 giorni", days: 30 },
  { label: "90 giorni", days: 90 },
  { label: "12 mesi", days: 365 },
];

const PLAN_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#22c55e"];

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const eur = (n: number) => `€${n.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;

function AdminDashboardPage() {
  const [days, setDays] = useState(30);
  const fetchDashboard = useServerFn(getAdminDashboard);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: () => fetchDashboard({ data: { days } }),
  });

  const usersGrowthConfig: ChartConfig = { new_users: { label: "Nuovi utenti", color: "#8b5cf6" } };
  const revenueConfig: ChartConfig = { revenue: { label: "Revenue", color: "#22c55e" } };
  const eventsConfig: ChartConfig = {
    new_subscriptions: { label: "Nuovi abbonamenti", color: "#06b6d4" },
    cancellations: { label: "Cancellazioni", color: "#ef4444" },
  };

  return (
    <AdminShell
      title="Dashboard"
      description="Panoramica in tempo reale del SaaS"
      breadcrumb={["Admin"]}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "default" : "outline"}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>

        {isError && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Impossibile caricare i dati della dashboard.
          </p>
        )}

        {isLoading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Utenti totali" value={String(data.kpis.total_users ?? 0)} />
              <KpiCard label="Nuovi utenti (30gg)" value={String(data.kpis.new_users_30d ?? 0)} />
              <KpiCard label="MRR" value={eur(data.kpis.mrr ?? 0)} />
              <KpiCard label="ARR" value={eur((data.kpis.mrr ?? 0) * 12)} />
              <KpiCard
                label="Abbonamenti attivi"
                value={String(data.kpis.active_subscriptions ?? 0)}
              />
              <KpiCard
                label="Trial attivi"
                value={String(data.kpis.trial_subscriptions ?? 0)}
                hint={`${data.kpis.trial_ending_7d ?? 0} in scadenza entro 7gg`}
              />
              <KpiCard label="Cancellati" value={String(data.kpis.cancelled_subscriptions ?? 0)} />
              <KpiCard
                label="Pagamenti falliti (30gg)"
                value={String(data.kpis.failed_payments_30d ?? 0)}
              />
              <KpiCard label="Utenti gratuiti" value={String(data.kpis.free_users ?? 0)} />
              <KpiCard label="Utenti paganti" value={String(data.kpis.paying_users ?? 0)} />
              <KpiCard label="Revenue (30gg)" value={eur(data.kpis.revenue_30d ?? 0)} />
              <KpiCard label="Past due" value={String(data.kpis.past_due_subscriptions ?? 0)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard label="DAU" value={String(data.activeUsers.dau ?? 0)} />
              <KpiCard label="WAU" value={String(data.activeUsers.wau ?? 0)} />
              <KpiCard label="MAU" value={String(data.activeUsers.mau ?? 0)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Crescita utenti</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={usersGrowthConfig} className="h-64 w-full">
                    <AreaChart data={data.usersGrowth}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) =>
                          new Date(v).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        dataKey="new_users"
                        type="monotone"
                        fill="var(--color-new_users)"
                        fillOpacity={0.2}
                        stroke="var(--color-new_users)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Revenue nel tempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={revenueConfig} className="h-64 w-full">
                    <BarChart data={data.revenue}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) =>
                          new Date(v).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Nuovi abbonamenti vs cancellazioni</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={eventsConfig} className="h-64 w-full">
                    <BarChart data={data.subscriptionEvents}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) =>
                          new Date(v).toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="new_subscriptions"
                        fill="var(--color-new_subscriptions)"
                        radius={4}
                      />
                      <Bar dataKey="cancellations" fill="var(--color-cancellations)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Distribuzione piani</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="mx-auto h-64 w-full max-w-xs">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="plan_name" />} />
                      <Pie
                        data={data.planDistribution}
                        dataKey="subscribers"
                        nameKey="plan_name"
                        innerRadius={50}
                      >
                        {data.planDistribution.map((_, i) => (
                          <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
