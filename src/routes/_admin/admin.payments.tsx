import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { exportAdminPayments, listAdminPayments } from "@/lib/admin/billing.functions";

export const Route = createFileRoute("/_admin/admin/payments")({
  head: () => ({
    meta: [{ title: "Pagamenti — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPaymentsPage,
});

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  succeeded: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
  cancelled: "outline",
};

function AdminPaymentsPage() {
  const fetchPayments = useServerFn(listAdminPayments);
  const exportCsv = useServerFn(exportAdminPayments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", search, statusFilter, from, to, page],
    queryFn: () =>
      fetchPayments({
        data: {
          search: search || undefined,
          status: statusFilter || undefined,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
          page,
          pageSize,
        },
      }),
  });

  async function handleExport() {
    setExporting(true);
    try {
      const result = await exportCsv({
        data: {
          status: statusFilter || undefined,
          from: from ? new Date(from).toISOString() : undefined,
          to: to ? new Date(to).toISOString() : undefined,
        },
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pagamenti_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (result.truncated) toast.warning("Export limitato alle prime 10.000 righe.");
      else toast.success("Export completato");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export non riuscito");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminShell
      title="Pagamenti"
      description="Storico transazioni da Lemon Squeezy"
      breadcrumb={["Admin", "Pagamenti"]}
      actions={
        <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting}>
          <Download className="mr-1.5 size-4" />
          {exporting ? "Esporto…" : "Esporta CSV"}
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Cerca email o ID transazione…"
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
              <SelectItem value="succeeded">Riuscito</SelectItem>
              <SelectItem value="pending">In corso</SelectItem>
              <SelectItem value="failed">Fallito</SelectItem>
              <SelectItem value="refunded">Rimborsato</SelectItem>
              <SelectItem value="cancelled">Annullato</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>

        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>ID transazione</TableHead>
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
              {!isLoading && data?.payments.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessun pagamento trovato.
                  </TableCell>
                </TableRow>
              )}
              {data?.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm">{p.user_name || "—"}</span>
                    <span className="block text-xs text-muted-foreground">{p.user_email}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.amount != null ? `${p.amount} ${p.currency}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.provider}</TableCell>
                  <TableCell className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground">
                    {p.provider_payment_id ?? "—"}
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
