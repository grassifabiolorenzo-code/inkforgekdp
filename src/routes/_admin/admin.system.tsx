import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSystemHealth } from "@/lib/admin/governance.functions";

export const Route = createFileRoute("/_admin/admin/system")({
  head: () => ({
    meta: [{ title: "Stato sistema — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSystemPage,
});

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "operational" ? "default" : status === "down" ? "destructive" : "outline";
  const label =
    status === "operational"
      ? "Operativo"
      : status === "down"
        ? "Non raggiungibile"
        : "Non configurato";
  return <Badge variant={variant}>{label}</Badge>;
}

function AdminSystemPage() {
  const fetchHealth = useServerFn(getSystemHealth);
  const { data, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: () => fetchHealth(),
    refetchInterval: 30_000,
  });

  return (
    <AdminShell
      title="Stato sistema"
      description="Diagnostica in tempo reale, nessun segreto mostrato"
      breadcrumb={["Admin", "Sistema"]}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {isLoading || !data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Ultimo controllo: {new Date(dataUpdatedAt).toLocaleTimeString("it-IT")}{" "}
              <button className="underline" onClick={() => void refetch()}>
                aggiorna ora
              </button>
            </p>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Database (Supabase)</CardTitle>
                <StatusBadge status={data.database.status} />
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Latenza: {data.database.latencyMs}ms
                {data.database.error && (
                  <p className="mt-1 text-destructive">{data.database.error}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Autenticazione</CardTitle>
                <StatusBadge status={data.authentication.status} />
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Supabase Auth</CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  Pagamenti — {data.paymentProvider.provider}
                </CardTitle>
                <StatusBadge status={data.paymentProvider.status} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-xs">
                  Dettaglio configurazione (solo presenza/assenza, mai i valori):
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                  {[
                    ["Chiave API", data.paymentProvider.details.apiKey],
                    ["Store ID", data.paymentProvider.details.storeId],
                    ["Webhook secret", data.paymentProvider.details.webhookSecret],
                    ["Variant Starter", data.paymentProvider.details.variantStarter],
                    ["Variant Pro", data.paymentProvider.details.variantPro],
                    ["Variant Business", data.paymentProvider.details.variantBusiness],
                  ].map(([label, ok]) => (
                    <div key={label as string} className="flex items-center gap-1.5">
                      <span
                        className={
                          ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        }
                      >
                        {ok ? "✓" : "✗"}
                      </span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 pt-1 text-xs">
                  <span
                    className={
                      data.paymentProvider.details.creditPackReady
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive"
                    }
                  >
                    {data.paymentProvider.details.creditPackReady ? "✓" : "✗"}
                  </span>
                  Pacchetto crediti extra (prodotto one-time)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Email transazionale</CardTitle>
                <StatusBadge status={data.emailProvider.status} />
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {data.emailProvider.note}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Generazione testi AI</CardTitle>
                <StatusBadge status={data.aiText.status} />
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {data.aiText.provider}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ambiente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {data.environment}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Hosting</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {data.hosting.platform} · {data.hosting.framework}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dominio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p className="font-mono text-foreground">{data.domain.url}</p>
                <p className="text-xs">{data.domain.source}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminShell>
  );
}
