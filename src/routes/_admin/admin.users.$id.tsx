import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PLANS } from "@/config/plans";
import { TOOLS } from "@/config/tools";
import { listEmailSends, sendManualEmailToUser } from "@/lib/admin/emailSends.functions";
import {
  changeAdminUserPlan,
  deleteAdminUser,
  generatePasswordResetLink,
  getAdminUserDetail,
  getAdminUserToolUsage,
  reactivateAdminUser,
  suspendAdminUser,
  updateAdminUserProfile,
} from "@/lib/admin/users.functions";

export const Route = createFileRoute("/_admin/admin/users/$id")({
  head: () => ({
    meta: [
      { title: "Dettaglio utente — Admin InkForgeKdp" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUserDetailPage,
});

interface UserDetail {
  profile: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    created_at: string;
  };
  auth: {
    last_sign_in_at: string | null;
    banned_until: string | null;
    email_confirmed_at: string | null;
  };
  admin_role: string | null;
  admin_suspended: boolean;
  subscriptions: {
    id: string;
    status: string;
    plan_slug: string | null;
    plan_name: string | null;
    plan_price: number | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancelled_at: string | null;
    credits_used: number;
    lemon_squeezy_subscription_id: string | null;
    created_at: string;
  }[];
  payments: {
    id: string;
    amount: number | null;
    currency: string;
    status: string;
    provider: string;
    description: string | null;
    created_at: string;
  }[];
  recent_activity: {
    tool_id: string;
    amount: number;
    source: string;
    description: string | null;
    created_at: string;
  }[];
}

function AdminUserDetailPage() {
  const { id } = useParams({ from: "/_admin/admin/users/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchDetail = useServerFn(getAdminUserDetail);
  const updateProfile = useServerFn(updateAdminUserProfile);
  const changePlan = useServerFn(changeAdminUserPlan);
  const suspend = useServerFn(suspendAdminUser);
  const reactivate = useServerFn(reactivateAdminUser);
  const deleteUser = useServerFn(deleteAdminUser);
  const resetLink = useServerFn(generatePasswordResetLink);
  const fetchEmailSends = useServerFn(listEmailSends);
  const sendManualEmail = useServerFn(sendManualEmailToUser);
  const fetchToolUsage = useServerFn(getAdminUserToolUsage);

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetLinkValue, setResetLinkValue] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeHtml, setComposeHtml] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => (await fetchDetail({ data: { userId: id } })) as unknown as UserDetail,
  });

  const { data: toolUsage, isLoading: loadingToolUsage } = useQuery({
    queryKey: ["admin-user-tool-usage", id],
    queryFn: () => fetchToolUsage({ data: { userId: id } }),
  });

  const { data: emailSends, isLoading: loadingEmailSends } = useQuery({
    queryKey: ["admin-user-email-sends", id],
    queryFn: () => fetchEmailSends({ data: { recipientUserId: id } }),
  });

  async function handleSendManualEmail() {
    setSendingEmail(true);
    try {
      await sendManualEmail({ data: { userId: id, subject: composeSubject, html: composeHtml } });
      toast.success("Email inviata (o messa in coda se il provider non è ancora collegato)");
      setComposeOpen(false);
      setComposeSubject("");
      setComposeHtml("");
      void queryClient.invalidateQueries({ queryKey: ["admin-user-email-sends", id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invio non riuscito");
    } finally {
      setSendingEmail(false);
    }
  }

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["admin-user-detail", id] });
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function handleSaveName() {
    if (nameDraft === null) return;
    try {
      await updateProfile({ data: { userId: id, name: nameDraft } });
      toast.success("Nome aggiornato");
      setNameDraft(null);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aggiornamento non riuscito");
    }
  }

  async function handleChangePlan(planSlug: string) {
    try {
      await changePlan({ data: { userId: id, planSlug } });
      toast.success("Piano aggiornato");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cambio piano non riuscito");
    }
  }

  const banned = data?.auth.banned_until ? new Date(data.auth.banned_until) > new Date() : false;

  async function handleToggleSuspend() {
    try {
      if (banned) await reactivate({ data: { userId: id } });
      else await suspend({ data: { userId: id } });
      toast.success(banned ? "Utente riattivato" : "Utente sospeso");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleResetLink() {
    try {
      const result = await resetLink({ data: { userId: id } });
      setResetLinkValue(result.link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generazione link non riuscita");
    }
  }

  async function handleDelete() {
    try {
      await deleteUser({ data: { userId: id } });
      toast.success("Utente eliminato");
      void navigate({ to: "/admin/users" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    }
  }

  if (isLoading || !data) {
    return (
      <AdminShell title="Dettaglio utente" breadcrumb={["Admin", "Utenti", "…"]}>
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminShell>
    );
  }

  const activeSub = data.subscriptions.find(
    (s) => s.status === "active" || s.status === "on_trial",
  );

  return (
    <AdminShell
      title={data.profile.name || data.profile.email || "Utente"}
      breadcrumb={["Admin", "Utenti", data.profile.email ?? id]}
      actions={
        <Button variant="outline" size="sm" onClick={() => void navigate({ to: "/admin/users" })}>
          ← Elenco utenti
        </Button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profilo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage src={data.profile.avatar ?? undefined} />
                <AvatarFallback>
                  {(data.profile.name || data.profile.email || "?").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">{data.profile.email}</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={nameDraft ?? data.profile.name ?? ""}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="max-w-xs"
                  />
                  {nameDraft !== null && nameDraft !== data.profile.name && (
                    <Button size="sm" onClick={handleSaveName}>
                      Salva
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right text-xs text-muted-foreground">
                <span>
                  Registrato: {new Date(data.profile.created_at).toLocaleDateString("it-IT")}
                </span>
                <span>
                  Ultimo accesso:{" "}
                  {data.auth.last_sign_in_at
                    ? new Date(data.auth.last_sign_in_at).toLocaleString("it-IT")
                    : "mai"}
                </span>
                {data.admin_role && <Badge variant="secondary">{data.admin_role}</Badge>}
                {banned && <Badge variant="destructive">Sospeso</Badge>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" onClick={handleToggleSuspend}>
                {banned ? "Riattiva account" : "Sospendi account"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetLink}>
                Genera link reset password
              </Button>
              <Button variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
                Invia email
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                Elimina utente
              </Button>
            </div>
            {resetLinkValue && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                <p className="mb-1 font-medium">Link di reset (copialo e invialo manualmente):</p>
                <p className="break-all font-mono">{resetLinkValue}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Abbonamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Piano attuale:</span>
              <Select value={activeSub?.plan_slug ?? ""} onValueChange={handleChangePlan}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Nessun piano" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.name} — €{p.price}/mese
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeSub && <Badge variant="outline">{activeSub.status}</Badge>}
            </div>
            {activeSub && (
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Periodo corrente</dt>
                  <dd>
                    {activeSub.current_period_end
                      ? new Date(activeSub.current_period_end).toLocaleDateString("it-IT")
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Crediti usati</dt>
                  <dd>{activeSub.credits_used}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Lemon Squeezy ID</dt>
                  <dd className="truncate font-mono text-xs">
                    {activeSub.lemon_squeezy_subscription_id ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Cancellato il</dt>
                  <dd>
                    {activeSub.cancelled_at
                      ? new Date(activeSub.cancelled_at).toLocaleDateString("it-IT")
                      : "—"}
                  </dd>
                </div>
              </dl>
            )}
            {!activeSub && (
              <p className="text-sm text-muted-foreground">Nessun abbonamento attivo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pagamenti recenti</CardTitle>
          </CardHeader>
          <CardContent>
            {data.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun pagamento registrato.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <span>{p.description ?? p.provider}</span>
                    <span className="text-muted-foreground">
                      {p.amount != null ? `${p.amount} ${p.currency}` : "—"} · {p.status} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Utilizzo per tool</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingToolUsage && <Skeleton className="h-16 w-full" />}
            {!loadingToolUsage &&
              (!toolUsage || Object.values(toolUsage.perTool).every((n) => n === 0)) && (
                <p className="text-sm text-muted-foreground">Nessun utilizzo registrato.</p>
              )}
            {!loadingToolUsage && toolUsage && (
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {TOOLS.map((tool) => (
                  <li
                    key={tool.id}
                    className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5"
                  >
                    <span className="text-muted-foreground">{tool.name}</span>
                    <span className="font-medium">{toolUsage.perTool[tool.id] ?? 0}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attività recente</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent_activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna attività registrata.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.recent_activity.map((a, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span>{a.description ?? a.tool_id}</span>
                    <span className="text-muted-foreground">
                      {a.source} · {new Date(a.created_at).toLocaleString("it-IT")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Corrispondenza email</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEmailSends && <Skeleton className="h-24 w-full" />}
            {!loadingEmailSends && (emailSends?.sends.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Nessuna email inviata finora.</p>
            )}
            {!loadingEmailSends && (emailSends?.sends.length ?? 0) > 0 && (
              <ul className="divide-y divide-border text-sm">
                {emailSends!.sends.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 py-2">
                    <div className="min-w-0">
                      <p className="truncate">{s.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.kind === "manual"
                          ? "Corrispondenza diretta"
                          : s.kind === "transactional"
                            ? (s.event ?? "Transazionale")
                            : "Promozionale"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant={
                          s.status === "sent"
                            ? "default"
                            : s.status === "failed"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {s.status}
                      </Badge>
                      {new Date(s.created_at).toLocaleString("it-IT")}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDangerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminare questo utente?"
        description="Questa operazione è irreversibile: l'account verrà eliminato definitivamente da Supabase Auth."
        confirmWord="ELIMINA"
        actionLabel="Elimina definitivamente"
        onConfirm={handleDelete}
      />

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invia email a {data.profile.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Oggetto</Label>
              <Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Corpo (HTML)</Label>
              <Textarea
                rows={8}
                value={composeHtml}
                onChange={(e) => setComposeHtml(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSendManualEmail}
              disabled={sendingEmail || !composeSubject.trim() || !composeHtml.trim()}
            >
              {sendingEmail ? "Invio…" : "Invia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
