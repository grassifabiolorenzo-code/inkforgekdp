import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRole } from "@/components/admin/useAdminRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { listAdminPlans, updateAdminPlan } from "@/lib/admin/billing.functions";

export const Route = createFileRoute("/_admin/admin/plans")({
  head: () => ({
    meta: [{ title: "Piani — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPlansPage,
});

interface PlanRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  monthly_limit: number | null;
  unlimited: boolean;
  active: boolean;
  sort_order: number;
  lemon_squeezy_variant_id: string | null;
}

function AdminPlansPage() {
  const role = useAdminRole();
  const isSuperAdmin = role === "super_admin";
  const queryClient = useQueryClient();
  const fetchPlans = useServerFn(listAdminPlans);
  const updatePlan = useServerFn(updateAdminPlan);
  const [drafts, setDrafts] = useState<Record<string, Partial<PlanRow>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => fetchPlans() as Promise<PlanRow[]>,
  });

  function draftFor(plan: PlanRow): PlanRow {
    return { ...plan, ...drafts[plan.id] };
  }

  async function handleSave(plan: PlanRow) {
    const draft = drafts[plan.id];
    if (!draft) return;
    try {
      await updatePlan({
        data: {
          planId: plan.id,
          ...(draft.name !== undefined ? { name: draft.name } : {}),
          ...(draft.price !== undefined ? { price: draft.price } : {}),
          ...(draft.monthly_limit !== undefined ? { monthlyLimit: draft.monthly_limit } : {}),
          ...(draft.unlimited !== undefined ? { unlimited: draft.unlimited } : {}),
          ...(draft.active !== undefined ? { active: draft.active } : {}),
        },
      });
      toast.success("Piano aggiornato");
      setDrafts((d) => {
        const next = { ...d };
        delete next[plan.id];
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aggiornamento non riuscito");
    }
  }

  return (
    <AdminShell
      title="Piani"
      description="Gestione piani di abbonamento"
      breadcrumb={["Admin", "Piani"]}
    >
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Il prezzo qui mostrato è quello registrato nel nostro database. L'importo{" "}
            <strong>realmente addebitato</strong> ai clienti è quello configurato sulla variant
            Lemon Squeezy collegata: modificare il prezzo qui non cambia automaticamente Lemon
            Squeezy. Per questo la modifica del prezzo è riservata al Super Admin.
          </p>
        </div>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {data?.map((plan) => {
          const draft = draftFor(plan);
          const dirty = !!drafts[plan.id];
          return (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  {plan.name} <span className="text-muted-foreground">({plan.slug})</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!plan.lemon_squeezy_variant_id && (
                    <Badge variant="outline" className="text-amber-600">
                      Variant Lemon Squeezy non collegata
                    </Badge>
                  )}
                  <Badge variant={plan.active ? "default" : "outline"}>
                    {plan.active ? "Attivo" : "Disattivato"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [plan.id]: { ...d[plan.id], name: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Prezzo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={!isSuperAdmin}
                    value={draft.price}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [plan.id]: { ...d[plan.id], price: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Limite mensile</Label>
                  <Input
                    type="number"
                    disabled={draft.unlimited}
                    value={draft.monthly_limit ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [plan.id]: {
                          ...d[plan.id],
                          monthly_limit: e.target.value ? Number(e.target.value) : null,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={draft.unlimited}
                      onCheckedChange={(v) =>
                        setDrafts((d) => ({ ...d, [plan.id]: { ...d[plan.id], unlimited: v } }))
                      }
                    />
                    <Label className="text-xs">Illimitato</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={draft.active}
                      onCheckedChange={(v) =>
                        setDrafts((d) => ({ ...d, [plan.id]: { ...d[plan.id], active: v } }))
                      }
                    />
                    <Label className="text-xs">Attivo</Label>
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <Button size="sm" disabled={!dirty} onClick={() => handleSave(plan)}>
                    Salva modifiche
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
