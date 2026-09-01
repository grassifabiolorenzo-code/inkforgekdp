import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { signOut } from "@/hooks/useAuth";
import { deleteMyAccount, exportMyData } from "@/lib/privacy.functions";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Impostazioni — InkForgeKdp" },
      { name: "description", content: "Preferenze account e sessione." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const exportData = useServerFn(exportMyData);
  const deleteAccount = useServerFn(deleteMyAccount);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inkforgekdp-dati-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Esportazione completata");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Esportazione non riuscita");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
      setDeleting(false);
    }
  }

  return (
    <DashboardShell title="Impostazioni" description="Sessione, dati e documenti">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="panel space-y-3 p-6">
          <h2 className="font-semibold">Documenti</h2>
          <div className="flex gap-3 text-sm">
            <Link to="/terms" className="underline hover:text-foreground">
              Termini
            </Link>
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>

        <div className="panel space-y-3 p-6">
          <h2 className="font-semibold">Sessione</h2>
          <p className="text-sm text-muted-foreground">
            Esci da questo dispositivo. Potrai rientrare in qualsiasi momento.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            Esci
          </Button>
        </div>

        <div className="panel space-y-3 p-6">
          <h2 className="font-semibold">I tuoi dati</h2>
          <p className="text-sm text-muted-foreground">
            Scarica una copia di tutti i tuoi dati: profilo, abbonamenti, utilizzi e pagamenti.
          </p>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="mr-1.5 size-4" />
            {exporting ? "Esporto…" : "Esporta i miei dati"}
          </Button>
        </div>

        <div className="panel space-y-3 border-destructive/30 p-6">
          <h2 className="font-semibold text-destructive">Elimina account</h2>
          <p className="text-sm text-muted-foreground">
            Elimina definitivamente il tuo account e tutti i dati collegati. Questa operazione non
            può essere annullata.
          </p>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Elimina il mio account
          </Button>
        </div>
      </div>

      <ConfirmDangerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminare definitivamente il tuo account?"
        description="Profilo, abbonamento e cronologia utilizzi verranno cancellati per sempre. Non potrai recuperarli."
        confirmWord="ELIMINA"
        actionLabel="Elimina definitivamente"
        onConfirm={handleDelete}
        pending={deleting}
      />
    </DashboardShell>
  );
}
