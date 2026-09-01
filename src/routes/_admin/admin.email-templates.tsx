import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  listEmailTemplates,
  toggleEmailTemplateActive,
  upsertEmailTemplate,
} from "@/lib/admin/emailTemplates.functions";

export const Route = createFileRoute("/_admin/admin/email-templates")({
  head: () => ({
    meta: [{ title: "Modelli email — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminEmailTemplatesPage,
});

interface TemplateRow {
  id: string;
  key: string;
  name: string;
  category: "transactional" | "promotional";
  locale: string;
  subject: string;
  body_html: string;
  is_active: boolean;
}

const EMPTY_FORM = {
  key: "",
  name: "",
  category: "promotional" as "transactional" | "promotional",
  locale: "it",
  subject: "",
  bodyHtml: "",
  isActive: true,
};

function AdminEmailTemplatesPage() {
  const queryClient = useQueryClient();
  const fetchTemplates = useServerFn(listEmailTemplates);
  const upsert = useServerFn(upsertEmailTemplate);
  const toggleActive = useServerFn(toggleEmailTemplateActive);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: () => fetchTemplates() as Promise<TemplateRow[]>,
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(template: TemplateRow) {
    setEditing(template);
    setForm({
      key: template.key,
      name: template.name,
      category: template.category,
      locale: template.locale,
      subject: template.subject,
      bodyHtml: template.body_html,
      isActive: template.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      await upsert({
        data: {
          ...(editing ? { id: editing.id } : {}),
          key: form.key,
          name: form.name,
          category: form.category,
          locale: form.locale,
          subject: form.subject,
          bodyHtml: form.bodyHtml,
          isActive: form.isActive,
        },
      });
      toast.success("Modello salvato");
      setDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Salvataggio non riuscito");
    }
  }

  async function handleToggle(template: TemplateRow) {
    try {
      await toggleActive({ data: { templateId: template.id, isActive: !template.is_active } });
      void queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  const transactional = data?.filter((t) => t.category === "transactional") ?? [];
  const promotional = data?.filter((t) => t.category === "promotional") ?? [];

  return (
    <AdminShell
      title="Modelli email"
      description="Contenuto delle email di ciclo vita e dei modelli promozionali riutilizzabili"
      breadcrumb={["Admin", "Marketing", "Modelli email"]}
      actions={
        <Button size="sm" onClick={openCreate}>
          Nuovo modello
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {isLoading && <Skeleton className="h-40 w-full" />}

        {!isLoading && (
          <>
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Transazionali (eventi di ciclo vita)
              </h2>
              {transactional.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => openEdit(template)}
                  onToggle={() => handleToggle(template)}
                />
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Promozionali</h2>
              {promotional.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nessun modello promozionale oltre al benvenuto lead.
                </p>
              )}
              {promotional.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => openEdit(template)}
                  onToggle={() => handleToggle(template)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifica modello" : "Nuovo modello"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Chiave (key)</Label>
                <Input
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="es. welcome, promo_black_friday"
                  disabled={!!editing}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nome interno</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(v: "transactional" | "promotional") =>
                    setForm((f) => ({ ...f, category: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transazionale</SelectItem>
                    <SelectItem value="promotional">Promozionale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lingua</Label>
                <Input
                  value={form.locale}
                  onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
                  placeholder="it"
                />
              </div>
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
                Variabili disponibili: {"{{name}}"}, {"{{plan_name}}"}
                {form.category === "promotional" && (
                  <>
                    {" "}
                    , {"{{unsubscribe_url}}"}, {"{{app_url}}"}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label>Attivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function TemplateCard({
  template,
  onEdit,
  onToggle,
}: {
  template: TemplateRow;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          {template.name}{" "}
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            {template.key} · {template.locale}
          </span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={template.is_active ? "default" : "outline"}>
            {template.is_active ? "Attivo" : "Disattivo"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {template.is_active ? "Disattiva" : "Attiva"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Modifica
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{template.subject}</CardContent>
    </Card>
  );
}
