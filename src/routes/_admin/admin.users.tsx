import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";
import {
  deleteAdminUser,
  listAdminUsers,
  reactivateAdminUser,
  suspendAdminUser,
} from "@/lib/admin/users.functions";

export const Route = createFileRoute("/_admin/admin/users")({
  head: () => ({
    meta: [{ title: "Utenti — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listAdminUsers);
  const suspend = useServerFn(suspendAdminUser);
  const reactivate = useServerFn(reactivateAdminUser);
  const deleteUser = useServerFn(deleteAdminUser);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string | null } | null>(
    null,
  );
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, planFilter, statusFilter, page],
    queryFn: () =>
      fetchUsers({
        data: {
          search: search || undefined,
          planSlug: planFilter || undefined,
          status: statusFilter || undefined,
          page,
          pageSize,
        },
      }),
  });

  async function handleSuspend(userId: string, banned: boolean) {
    try {
      if (banned) await reactivate({ data: { userId } });
      else await suspend({ data: { userId } });
      toast.success(banned ? "Utente riattivato" : "Utente sospeso");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteUser({ data: { userId: deleteTarget.id } });
      toast.success("Utente eliminato");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    }
  }

  return (
    <AdminShell
      title="Utenti"
      description="Gestione account, piani e stato"
      breadcrumb={["Admin", "Utenti"]}
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Cerca per nome o email…"
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
              <SelectItem value="none">Nessun piano</SelectItem>
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
              <SelectValue placeholder="Stato abbonamento" />
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
                <TableHead>Utente</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Piano</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Registrato</TableHead>
                <TableHead>Ultimo accesso</TableHead>
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
              {!isLoading && data?.users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessun utente trovato con questi filtri.
                  </TableCell>
                </TableRow>
              )}
              {data?.users.map((u) => {
                const banned = u.banned_until ? new Date(u.banned_until) > new Date() : false;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link
                        to="/admin/users/$id"
                        params={{ id: u.id }}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <Avatar className="size-8">
                          <AvatarImage src={u.avatar ?? undefined} />
                          <AvatarFallback>
                            {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {u.name || "—"}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {u.email}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {u.admin_role ? (
                        <Badge variant="secondary">{u.admin_role}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">user</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{u.plan_name ?? "—"}</TableCell>
                    <TableCell>
                      {banned ? (
                        <Badge variant="destructive">Sospeso</Badge>
                      ) : u.subscription_status ? (
                        <Badge variant="outline">{u.subscription_status}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">free</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString("it-IT")
                        : "mai"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Azioni
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/admin/users/$id" params={{ id: u.id }}>
                              Visualizza dettaglio
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuspend(u.id, banned)}>
                            {banned ? "Riattiva account" : "Sospendi account"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                          >
                            Elimina utente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        title="Eliminare questo utente?"
        description={`Questa operazione è irreversibile: l'account ${deleteTarget?.email ?? ""} verrà eliminato definitivamente da Supabase Auth insieme a profilo e abbonamenti collegati.`}
        confirmWord="ELIMINA"
        actionLabel="Elimina definitivamente"
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}
