import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminRole } from "@/components/admin/useAdminRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAdminGeneralSettings,
  updateAdminGeneralSettings,
} from "@/lib/admin/governance.functions";

export const Route = createFileRoute("/_admin/admin/settings")({
  head: () => ({
    meta: [{ title: "Impostazioni — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const role = useAdminRole();
  const canWrite = role === "super_admin";
  const fetchSettings = useServerFn(getAdminGeneralSettings);
  const saveSettings = useServerFn(updateAdminGeneralSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-general-settings"],
    queryFn: () => fetchSettings(),
  });
  const [form, setForm] = useState({ saasName: "InkForgeKdp", supportEmail: "", publicUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings({ data: form });
      toast.success("Impostazioni salvate");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Salvataggio non riuscito");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Impostazioni"
      description="Configurazione generale del SaaS"
      breadcrumb={["Admin", "Impostazioni"]}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generale</CardTitle>
            <CardDescription>
              Nome, URL pubblico ed email di supporto mostrati nell'app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-saas-name">Nome del SaaS</Label>
                  <Input
                    id="settings-saas-name"
                    disabled={!canWrite}
                    value={form.saasName}
                    onChange={(e) => setForm((f) => ({ ...f, saasName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-support-email">Email di supporto</Label>
                  <Input
                    id="settings-support-email"
                    type="email"
                    disabled={!canWrite}
                    value={form.supportEmail}
                    onChange={(e) => setForm((f) => ({ ...f, supportEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-public-url">URL pubblico</Label>
                  <Input
                    id="settings-public-url"
                    type="url"
                    disabled={!canWrite}
                    value={form.publicUrl}
                    onChange={(e) => setForm((f) => ({ ...f, publicUrl: e.target.value }))}
                  />
                </div>
                {canWrite && (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Salvo…" : "Salva impostazioni"}
                  </Button>
                )}
                {!canWrite && (
                  <p className="text-xs text-muted-foreground">Sola lettura per il tuo ruolo.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Autenticazione</CardTitle>
            <CardDescription>
              Gestita da Supabase Auth (provider, verifica email, password policy).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Provider: Supabase Auth (email/password). La configurazione avanzata (policy password,
            2FA, domini consentiti) si gestisce dal pannello Supabase del progetto, non da qui, per
            evitare due fonti di verità sulla sicurezza degli account.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Billing</CardTitle>
            <CardDescription>Provider di pagamento e valuta.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Provider: Lemon Squeezy · Valuta: EUR. Stato della configurazione visibile in{" "}
            <span className="font-medium text-foreground">Stato sistema</span>.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Email</CardTitle>
            <CardDescription>Provider email transazionale.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Nessun provider email transazionale collegato: le notifiche vengono registrate nei log
            del server e nel campanello admin, ma non inviate via email finché non viene integrato
            un provider (es. Resend).
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
