import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicStatus } from "@/lib/status.functions";

const title = "Stato del sistema — InkForgeKdp";
const description =
  "Stato in tempo reale di InkForgeKdp: applicazione, autenticazione, pagamenti e generazione contenuti AI.";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "/brand/logo.png" },
      { name: "twitter:image", content: "/brand/logo.png" },
    ],
  }),
  component: StatusPage,
});

const STATUS_META: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> =
  {
    operational: { label: "Operativo", icon: CheckCircle2, className: "text-emerald-500" },
    degraded: { label: "Degradato", icon: AlertTriangle, className: "text-amber-500" },
    not_configured: { label: "Non configurato", icon: AlertTriangle, className: "text-amber-500" },
    down: { label: "Non raggiungibile", icon: XCircle, className: "text-red-500" },
  };

function StatusPage() {
  const fetchStatus = useServerFn(getPublicStatus);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-status"],
    queryFn: () => fetchStatus(),
    refetchInterval: 60_000,
  });

  const allOperational = data?.components.every((c) => c.status === "operational");

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Stato del sistema</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aggiornato automaticamente ogni minuto.
          </p>
        </div>

        <div className="mt-8">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              Impossibile caricare lo stato in questo momento.
            </p>
          )}

          {data && (
            <>
              <div
                className={
                  allOperational
                    ? "mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    : "mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-700 dark:text-amber-400"
                }
              >
                {allOperational
                  ? "Tutti i sistemi sono operativi"
                  : "Alcuni sistemi hanno problemi"}
              </div>

              <div className="panel divide-y divide-border p-0">
                {data.components.map((component) => {
                  const meta = STATUS_META[component.status] ?? STATUS_META["down"]!;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={component.name}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <span className="text-sm font-medium">{component.name}</span>
                      <Badge variant="outline" className="gap-1.5">
                        <Icon className={`size-3.5 ${meta.className}`} />
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Ultimo controllo: {new Date(data.checkedAt).toLocaleString("it-IT")}
              </p>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
