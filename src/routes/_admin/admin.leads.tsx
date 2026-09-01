import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  deleteLead,
  listAdminLeads,
  resubscribeLead,
  unsubscribeLead,
} from "@/lib/admin/leads.functions";
import { getEmailKpis } from "@/lib/admin/emailSends.functions";

export const Route = createFileRoute("/_admin/admin/leads")({
  head: () => ({
    meta: [{ title: "Lead — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLeadsPage,
});

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  subscribed: "default",
  unsubscribed: "outline",
  bounced: "destructive",
};

function KpiCard({ label, value }: { label: string; value: string }) {
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

function AdminLeadsPage() {
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listAdminLeads);
  const fetchKpis = useServerFn(getEmailKpis);
  const resubscribe = useServerFn(resubscribeLead);
  const unsubscribe = useServerFn(unsubscribeLead);
  const remove = useServerFn(deleteLead);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
  const pageSize = 25;

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["admin-email-kpis"],
    queryFn: () => fetchKpis(),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads", search, statusFilter, page],
    queryFn: () =>
      fetchLeads({
        data: { search: search || undefined, status: statusFilter || undefined, page, pageSize },
      }),
  });

  async function handleToggleStatus(leadId: string, currentStatus: string) {
    try {
      if (currentStatus === "unsubscribed") await resubscribe({ data: { leadId } });
      else await unsubscribe({ data: { leadId } });
      toast.success(
        currentStatus === "unsubscribed" ? "Contatto riattivato" : "Contatto disiscritto",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove({ data: { leadId: deleteTarget.id } });
      toast.success("Contatto eliminato");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    }
  }

  return (
    <AdminShell
      title="Lead"
      description="Contatti raccolti dalla newsletter della landing page"
      breadcrumb={["Admin", "Marketing", "Lead"]}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {loadingKpis || !kpis ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Contatti totali" value={String(kpis.total_leads)} />
            <KpiCard label="Iscritti attivi" value={String(kpis.subscribed_leads)} />
            <KpiCard label="Disiscritti" value={String(kpis.unsubscribed_leads)} />
            <KpiCard label="Convertiti in abbonati" value={String(kpis.converted_leads)} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Cerca per email o nome…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
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
              <SelectItem value="subscribed">Iscritto</SelectItem>
              <SelectItem value="unsubscribed">Disiscritto</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Convertito</TableHead>
                <TableHead>Iscritto il</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data?.leads.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessun contatto trovato.
                  </TableCell>
                </TableRow>
              )}
              {data?.leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.source}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[lead.status] ?? "outline"}>{lead.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.converted_user_id ? "Sì" : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Azioni
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleStatus(lead.id, lead.status)}>
                          {lead.status === "unsubscribed" ? "Riattiva" : "Disiscrivi"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget({ id: lead.id, email: lead.email })}
                        >
                          Elimina
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <ConfirmDangerDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Eliminare questo contatto?"
        description={`Il contatto ${deleteTarget?.email ?? ""} verrà eliminato definitivamente (cancellazione dati su richiesta GDPR). Questa operazione non può essere annullata.`}
        confirmWord="ELIMINA"
        actionLabel="Elimina"
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}
