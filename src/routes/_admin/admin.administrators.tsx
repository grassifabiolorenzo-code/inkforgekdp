import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { useAdminRole } from "@/components/admin/useAdminRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ADMIN_ROLES, ROLE_LABELS, type AdminRole } from "@/lib/adminRbac";
import {
  addAdministrator,
  listAdministrators,
  removeAdministrator,
  suspendAdministrator,
  updateAdministratorRole,
} from "@/lib/admin/governance.functions";

export const Route = createFileRoute("/_admin/admin/administrators")({
  head: () => ({
    meta: [{ title: "Amministratori — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAdministratorsPage,
});

interface AdminRow {
  user_id: string;
  role: string;
  suspended: boolean;
  last_login_at: string | null;
  created_at: string;
  email: string | null;
}

function AdminAdministratorsPage() {
  const role = useAdminRole();
  const queryClient = useQueryClient();
  const fetchAdmins = useServerFn(listAdministrators);
  const addAdmin = useServerFn(addAdministrator);
  const updateRole = useServerFn(updateAdministratorRole);
  const suspend = useServerFn(suspendAdministrator);
  const remove = useServerFn(removeAdministrator);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("support");
  const [removeTarget, setRemoveTarget] = useState<AdminRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-administrators"],
    queryFn: () => fetchAdmins() as Promise<AdminRow[]>,
  });

  if (role && role !== "super_admin") {
    return (
      <AdminShell title="Amministratori" breadcrumb={["Admin", "Amministratori"]}>
        <p className="rounded-lg border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
          Solo il Super Admin può gestire gli amministratori.
        </p>
      </AdminShell>
    );
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin-administrators"] });
  }

  async function handleAdd() {
    try {
      await addAdmin({ data: { email, role: newRole } });
      toast.success("Amministratore aggiunto");
      setDialogOpen(false);
      setEmail("");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleRoleChange(userId: string, role_: AdminRole) {
    try {
      await updateRole({ data: { userId, role: role_ } });
      toast.success("Ruolo aggiornato");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleSuspend(userId: string) {
    try {
      await suspend({ data: { userId } });
      toast.success("Amministratore sospeso");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      await remove({ data: { userId: removeTarget.user_id } });
      toast.success("Amministratore rimosso");
      setRemoveTarget(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  return (
    <AdminShell
      title="Amministratori"
      description="Solo il Super Admin può gestire questa sezione"
      breadcrumb={["Admin", "Amministratori"]}
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 size-4" /> Aggiungi
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ultimo accesso</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {data?.map((admin) => (
                <TableRow key={admin.user_id}>
                  <TableCell className="text-sm">{admin.email ?? admin.user_id}</TableCell>
                  <TableCell>
                    <Select
                      value={admin.role}
                      onValueChange={(v) => handleRoleChange(admin.user_id, v as AdminRole)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.suspended ? "destructive" : "default"}>
                      {admin.suspended ? "Sospeso" : "Attivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {admin.last_login_at
                      ? new Date(admin.last_login_at).toLocaleString("it-IT")
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
                        {!admin.suspended && (
                          <DropdownMenuItem onClick={() => handleSuspend(admin.user_id)}>
                            Sospendi accesso
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRemoveTarget(admin)}
                        >
                          Rimuovi amministratore
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi amministratore</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email (l'account deve già esistere)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ruolo</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleAdd} disabled={!email}>
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDangerDialog
        open={!!removeTarget}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title="Rimuovere questo amministratore?"
        description={`${removeTarget?.email ?? ""} perderà immediatamente l'accesso al back office.`}
        confirmWord="RIMUOVI"
        actionLabel="Rimuovi"
        onConfirm={handleRemove}
      />
    </AdminShell>
  );
}
