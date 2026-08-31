import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAuditLogs } from "@/lib/admin/governance.functions";

export const Route = createFileRoute("/_admin/admin/audit-logs")({
  head: () => ({
    meta: [{ title: "Audit log — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  const fetchLogs = useServerFn(listAuditLogs);
  const [adminEmail, setAdminEmail] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", adminEmail, action, page],
    queryFn: () =>
      fetchLogs({
        data: { adminEmail: adminEmail || undefined, action: action || undefined, page, pageSize },
      }),
  });

  return (
    <AdminShell
      title="Audit log"
      description="Registro immutabile di tutte le operazioni amministrative"
      breadcrumb={["Admin", "Audit log"]}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Filtra per email admin…"
            value={adminEmail}
            onChange={(e) => {
              setAdminEmail(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Input
            placeholder="Filtra per azione (es. USER_DELETED)…"
            value={action}
            onChange={(e) => {
              setAction(e.target.value.toUpperCase());
              setPage(1);
            }}
            className="max-w-xs"
          />
        </div>

        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Azione</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Esito</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data?.logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessun evento registrato.
                  </TableCell>
                </TableRow>
              )}
              {data?.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-sm">{log.admin_email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.target_type ? `${log.target_type}:${log.target_id}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.result === "success" ? "default" : "destructive"}>
                      {log.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip ?? "—"}</TableCell>
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
