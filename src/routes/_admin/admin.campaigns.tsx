import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmailCampaign,
  deleteEmailCampaign,
  listEmailCampaigns,
  sendEmailCampaignNow,
} from "@/lib/admin/campaigns.functions";

export const Route = createFileRoute("/_admin/admin/campaigns")({
  head: () => ({
    meta: [{ title: "Campagne email — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCampaignsPage,
});

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  draft: "outline",
  scheduled: "secondary",
  sending: "secondary",
  sent: "default",
  failed: "destructive",
  cancelled: "outline",
};

const AUDIENCE_LABELS: Record<string, string> = {
  all_leads: "Tutti i lead",
  all_subscribers: "Tutti gli abbonati",
  plan_starter: "Piano Starter",
  plan_pro: "Piano Pro",
  plan_business: "Piano Business",
  all_contacts: "Tutti i contatti (lead + abbonati)",
};

const EMPTY_FORM = {
  name: "",
  subject: "",
  bodyHtml: "",
  audience: "all_subscribers" as keyof typeof AUDIENCE_LABELS,
};

function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const fetchCampaigns = useServerFn(listEmailCampaigns);
  const create = useServerFn(createEmailCampaign);
  const remove = useServerFn(deleteEmailCampaign);
  const sendNow = useServerFn(sendEmailCampaignNow);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sendTarget, setSendTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-email-campaigns"],
    queryFn: () => fetchCampaigns({ data: {} }),
  });

  async function handleCreate() {
    try {
      await create({
        data: {
          name: form.name,
          subject: form.subject,
          bodyHtml: form.bodyHtml,
          audience: form.audience,
        },
      });
      toast.success("Campagna creata come bozza");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      void queryClient.invalidateQueries({ queryKey: ["admin-email-campaigns"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creazione non riuscita");
    }
  }

  async function handleSendNow() {
    if (!sendTarget) return;
    setSending(true);
    try {
      const result = await sendNow({ data: { campaignId: sendTarget.id } });
      toast.success(`Campagna inviata: ${result.sent}/${result.recipientsTotal} destinatari`);
      setSendTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-email-campaigns"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invio non riuscito");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await remove({ data: { campaignId: deleteTarget.id } });
      toast.success("Campagna eliminata");
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-email-campaigns"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    }
  }

  return (
    <AdminShell
      title="Campagne email"
      description="Broadcast promozionali verso lead e/o abbonati, subito o programmati"
      breadcrumb={["Admin", "Marketing", "Campagne"]}
      actions={
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          Nuova campagna
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Destinatari</TableHead>
                <TableHead>Inviata il</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data?.campaigns.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessuna campagna creata.
                  </TableCell>
                </TableRow>
              )}
              {data?.campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {AUDIENCE_LABELS[c.audience] ?? c.audience}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status] ?? "outline"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.status === "sent" ? `${c.recipients_sent}/${c.recipients_total}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.sent_at ? new Date(c.sent_at).toLocaleString("it-IT") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {(c.status === "draft" || c.status === "scheduled") && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSendTarget({ id: c.id, name: c.name })}
                        >
                          Invia ora
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                        >
                          Elimina
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova campagna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome interno</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="es. Promo autunno 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Segmento destinatari</Label>
              <Select
                value={form.audience}
                onValueChange={(v: keyof typeof AUDIENCE_LABELS) =>
                  setForm((f) => ({ ...f, audience: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Oggetto</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Corpo (HTML)</Label>
              <Textarea
                rows={10}
                value={form.bodyHtml}
                onChange={(e) => setForm((f) => ({ ...f, bodyHtml: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Il link di disiscrizione viene aggiunto automaticamente ovunque compaia{" "}
                {"{{unsubscribe_url}}"} nel testo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreate}>Crea come bozza</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDangerDialog
        open={!!sendTarget}
        onOpenChange={(v) => !v && setSendTarget(null)}
        title="Inviare questa campagna ora?"
        description={`"${sendTarget?.name ?? ""}" verrà inviata a tutti i destinatari del segmento selezionato. Richiede 2FA attivo (Admin → Sicurezza). Questa operazione non può essere annullata.`}
        confirmWord="INVIA"
        actionLabel="Invia ora"
        onConfirm={handleSendNow}
        pending={sending}
      />

      <ConfirmDangerDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Eliminare questa campagna?"
        description={`La bozza "${deleteTarget?.name ?? ""}" verrà eliminata definitivamente.`}
        confirmWord="ELIMINA"
        actionLabel="Elimina"
        onConfirm={handleDelete}
      />
    </AdminShell>
  );
}
