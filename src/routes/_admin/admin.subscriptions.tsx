import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PLANS } from "@/config/plans";
import { listAdminSubscriptions } from "@/lib/admin/billing.functions";

export const Route = createFileRoute("/_admin/admin/subscriptions")({
  head: () => ({
    meta: [{ title: "Abbonamenti — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSubscriptionsPage,
});

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  active: "default",
  on_trial: "secondary",
  past_due: "destructive",
  cancelled: "outline",
  expired: "outline",
  paused: "outline",
};

function AdminSubscriptionsPage() {
  const fetchSubs = useServerFn(listAdminSubscriptions);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", search, planFilter, statusFilter, page],
    queryFn: () =>
      fetchSubs({
        data: {
          search: search || undefined,
          planSlug: planFilter || undefined,
          status: statusFilter || undefined,
          page,
          pageSize,
        },
      }),
  });

  return (
    <AdminShell
      title="Abbonamenti"
      description="Tutti gli abbonamenti, attivi e non"
      breadcrumb={["Admin", "Abbonamenti"]}
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Cerca cliente…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Select
            value={planFilter || "all"}
            onValueChange={(v) => {
              setPlanFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Piano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i piani</SelectItem>
              {PLANS.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Attivo</SelectItem>
              <SelectItem value="on_trial">Trial</SelectItem>
              <SelectItem value="past_due">Past due</SelectItem>
              <SelectItem value="cancelled">Cancellato</SelectItem>
              <SelectItem value="expired">Scaduto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Piano</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Rinnovo</TableHead>
                <TableHead>Creato il</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data?.subscriptions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessun abbonamento trovato.
                  </TableCell>
                </TableRow>
              )}
              {data?.subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="block text-sm font-medium">{s.user_name || "—"}</span>
                    <span className="block text-xs text-muted-foreground">{s.user_email}</span>
                  </TableCell>
                  <TableCell className="text-sm">{s.plan_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {s.plan_price != null ? `€${s.plan_price}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString("it-IT")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("it-IT")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3">
            <AdminPagination
              page={page}
              pageSize={pageSize}
              totalCount={data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
