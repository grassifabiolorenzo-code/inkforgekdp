import { createFileRoute } from "@tanstack/react-router";
import { FileImage, FileText, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Input } from "@/components/ui/input";
import { useBookProject, type BookProjectRow } from "@/hooks/useBookProject";

export const Route = createFileRoute("/_authenticated/dashboard/projects")({
  head: () => ({
    meta: [
      { title: "Progetti libro — InkForgeKdp" },
      {
        name: "description",
        content:
          "Gestisci i progetti libro condivisi tra i tool: copertina e interno riusati automaticamente.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const bookProject = useBookProject();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [creatingBusy, setCreatingBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookProjectRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreatingBusy(true);
    try {
      await bookProject.createProject(newName.trim());
      toast.success("Progetto creato");
      setCreating(false);
      setNewName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creazione non riuscita");
    } finally {
      setCreatingBusy(false);
    }
  }

  function startRename(project: BookProjectRow) {
    setRenamingId(project.id);
    setRenameValue(project.name);
  }

  async function handleRename() {
    if (!renamingId || !renameValue.trim()) return;
    setRenameBusy(true);
    try {
      await bookProject.renameProject(renamingId, renameValue.trim());
      toast.success("Progetto rinominato");
      setRenamingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rinomina non riuscita");
    } finally {
      setRenameBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await bookProject.removeProject(deleteTarget.id);
      toast.success("Progetto eliminato");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <DashboardShell
      title="Progetti libro"
      description="Copertina e interno condivisi tra i tool, senza doverli ricaricare ogni volta"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="panel space-y-2 p-6">
          <h2 className="font-semibold">Come funzionano</h2>
          <p className="text-sm text-muted-foreground">
            Crea un progetto per ogni libro a cui stai lavorando, carica copertina e/o interno da un
            qualsiasi tool (Pubblicazione, A+, Blurb, Bio, Promo, o come output di Interni e
            Copertine) e riusali negli altri tool senza ricaricarli. Ogni progetto scade
            automaticamente 6 ore dopo l'ultimo utilizzo.
          </p>
        </div>

        <div className="panel space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">I tuoi progetti</h2>
            {!creating && (
              <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 size-3.5" /> Nuovo progetto
              </Button>
            )}
          </div>

          {creating && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface p-3">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome del progetto (es. il titolo del libro)"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || creatingBusy}>
                Crea
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
              >
                Annulla
              </Button>
            </div>
          )}

          {bookProject.isLoading && <p className="text-sm text-muted-foreground">Caricamento…</p>}

          {!bookProject.isLoading && bookProject.projects.length === 0 && !creating && (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <FolderOpen className="mx-auto mb-2 size-5" />
              Nessun progetto ancora. Creane uno qui, oppure caricalo direttamente da un tool.
            </p>
          )}

          <div className="space-y-2">
            {bookProject.projects.map((project) => (
              <div
                key={project.id}
                className="space-y-2 rounded-md border border-border bg-surface p-3"
              >
                {renamingId === project.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    />
                    <Button
                      size="sm"
                      onClick={handleRename}
                      disabled={!renameValue.trim() || renameBusy}
                    >
                      Salva
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                      Annulla
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{project.name}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0"
                        onClick={() => startRename(project)}
                        title="Rinomina"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(project)}
                        title="Elimina"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileImage className="size-3.5" />
                    {project.cover_path ? "Copertina salvata" : "Nessuna copertina"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="size-3.5" />
                    {project.interior_path ? "Interno salvato" : "Nessun interno"}
                  </span>
                  <span>Aggiornato: {new Date(project.updated_at).toLocaleString("it-IT")}</span>
                  <span>Scade: {new Date(project.expires_at).toLocaleString("it-IT")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Copertina e interno salvati per questo progetto verranno rimossi definitivamente.
              Questa operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" disabled={deleteBusy} onClick={handleDelete}>
                {deleteBusy ? "Elimino…" : "Elimina"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
