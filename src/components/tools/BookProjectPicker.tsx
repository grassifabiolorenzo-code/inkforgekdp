import { FolderOpen, Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseBookProjectReturn } from "@/hooks/useBookProject";

const NEW_PROJECT_VALUE = "__new__";
const NONE_VALUE = "__none__";

/**
 * Selettore del progetto libro condiviso tra i tool: scegliendo un progetto,
 * copertina/interno già salvati vengono scaricati e passati al tool tramite
 * onFilesLoaded — nessuna modifica alla logica di estrazione/AI di ciascun
 * tool, il picker si limita a riempire gli stessi stati che oggi riempie solo
 * l'upload manuale.
 */
export function BookProjectPicker({
  bookProject,
  onFilesLoaded,
  currentCoverFile,
  currentInteriorFile,
}: {
  bookProject: UseBookProjectReturn;
  onFilesLoaded: (files: { cover: File | null; interior: File | null }) => void;
  currentCoverFile: File | null;
  currentInteriorFile: File | null;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChange(value: string) {
    if (value === NEW_PROJECT_VALUE) {
      setCreating(true);
      return;
    }
    setLoading(true);
    try {
      const files = await bookProject.selectAndLoad(value === NONE_VALUE ? null : value);
      onFilesLoaded(files);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossibile caricare il progetto");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await bookProject.createProject(newName.trim());
      onFilesLoaded({ cover: null, interior: null });
      setCreating(false);
      setNewName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creazione non riuscita");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!bookProject.selectedId) return;
    setSaving(true);
    try {
      await bookProject.saveFiles(currentCoverFile, currentInteriorFile);
      toast.success(`Salvato nel progetto "${bookProject.selectedProject?.name}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Salvataggio non riuscito");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome del progetto (es. il titolo del libro)"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || loading}>
          Crea
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
          Annulla
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={bookProject.selectedId ?? NONE_VALUE}
        onValueChange={handleChange}
        disabled={loading}
      >
        <SelectTrigger className="w-auto min-w-[220px]">
          <FolderOpen className="mr-1.5 size-3.5 text-muted-foreground" />
          <SelectValue placeholder="Nessun progetto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Nessuno (carica file al volo)</SelectItem>
          {bookProject.projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
          <SelectItem value={NEW_PROJECT_VALUE}>
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5" /> Nuovo progetto
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {bookProject.selectedId && (currentCoverFile || currentInteriorFile) && (
        <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
          <Save className="mr-1.5 size-3.5" />
          {saving ? "Salvo…" : "Salva nel progetto"}
        </Button>
      )}
    </div>
  );
}
