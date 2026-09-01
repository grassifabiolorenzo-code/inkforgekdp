import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PLANS } from "@/config/plans";
import {
  deleteFeatureFlag,
  listFeatureFlags,
  upsertFeatureFlag,
} from "@/lib/admin/governance.functions";

export const Route = createFileRoute("/_admin/admin/features")({
  head: () => ({
    meta: [{ title: "Feature flags — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminFeaturesPage,
});

interface FlagRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  enabled_for_all: boolean;
  enabled_plans: string[];
  enabled_user_ids: string[];
}

const EMPTY_FORM = {
  key: "",
  name: "",
  description: "",
  enabled: true,
  enabledForAll: false,
  enabledPlans: [] as string[],
};

function AdminFeaturesPage() {
  const queryClient = useQueryClient();
  const fetchFlags = useServerFn(listFeatureFlags);
  const upsert = useServerFn(upsertFeatureFlag);
  const remove = useServerFn(deleteFeatureFlag);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FlagRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<FlagRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-features"],
    queryFn: () => fetchFlags() as Promise<FlagRow[]>,
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(flag: FlagRow) {
    setEditing(flag);
    setForm({
      key: flag.key,
      name: flag.name,
      description: flag.description ?? "",
      enabled: flag.enabled,
      enabledForAll: flag.enabled_for_all,
      enabledPlans: flag.enabled_plans,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      await upsert({
        data: {
          ...(editing ? { id: editing.id } : {}),
          key: form.key.toUpperCase(),
          name: form.name,
          description: form.description || undefined,
          enabled: form.enabled,
          enabledForAll: form.enabledForAll,
          enabledPlans: form.enabledPlans,
          enabledUserIds: editing ? undefined : [],
        },
      });
      toast.success("Feature flag salvata");
      setDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-features"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Salvataggio non riuscito");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove({ data: { id: deleteTarget.id } });
      toast.success("Feature flag eliminata");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-features"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    }
  }

  function togglePlan(slug: string) {
    setForm((f) => ({
      ...f,
      enabledPlans: f.enabledPlans.includes(slug)
        ? f.enabledPlans.filter((p) => p !== slug)
        : [...f.enabledPlans, slug],
    }));
  }

  return (
    <AdminShell
      title="Feature flags"
      description="Abilita funzionalità globalmente, per piano o per singolo utente"
      breadcrumb={["Admin", "Feature flags"]}
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" /> Nuova flag
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-3">
        {isLoading && <Skeleton className="h-40 w-full" />}
        {!isLoading && data?.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nessuna feature flag configurata.
          </p>
        )}
        {data?.map((flag) => (
          <Card key={flag.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {flag.name}{" "}
                <span className="ml-2 font-mono text-xs text-muted-foreground">{flag.key}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={flag.enabled ? "default" : "outline"}>
                  {flag.enabled ? "Abilitata" : "Disabilitata"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => openEdit(flag)}>
                  Modifica
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(flag)}
                  aria-label={`Elimina la flag ${flag.name}`}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {flag.description && <p>{flag.description}</p>}
              <p>
                {flag.enabled_for_all
                  ? "Disponibile per tutti gli utenti"
                  : flag.enabled_plans.length > 0
                    ? `Disponibile per: ${flag.enabled_plans.join(", ")}`
                    : `${flag.enabled_user_ids.length} utenti specifici`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica feature flag" : "Nuova feature flag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="flag-key">Chiave</Label>
                <Input
                  id="flag-key"
                  disabled={!!editing}
                  placeholder="ADVANCED_ANALYTICS"
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flag-name">Nome</Label>
                <Input
                  id="flag-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flag-description">Descrizione</Label>
              <Textarea
                id="flag-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="flag-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
              <Label htmlFor="flag-enabled">Abilitata</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="flag-enabled-for-all"
                checked={form.enabledForAll}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabledForAll: v }))}
              />
              <Label htmlFor="flag-enabled-for-all">Disponibile per tutti gli utenti</Label>
            </div>
            {!form.enabledForAll && (
              <div className="space-y-1.5">
                <Label className="text-xs">Oppure limita a questi piani</Label>
                <div className="flex flex-wrap gap-2">
                  {PLANS.map((p) => (
                    <Button
                      key={p.slug}
                      type="button"
                      size="sm"
                      variant={form.enabledPlans.includes(p.slug) ? "default" : "outline"}
                      onClick={() => togglePlan(p.slug)}
                    >
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={!form.key || !form.name}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDangerDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Eliminare questa feature flag?"
        description={`La flag "${deleteTarget?.key}" verrà rimossa e ogni controllo lato server che la usa tornerà a restituire "disabilitata".`}
        confirmWord="ELIMINA"
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}
