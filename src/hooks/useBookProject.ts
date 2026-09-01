import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  deleteBookProject,
  listMyBookProjects,
  upsertBookProject,
} from "@/lib/bookProjects.functions";
import {
  downloadProjectFile,
  removeProjectFiles,
  uploadProjectFile,
} from "@/lib/bookProjectStorage";

/**
 * Un'unica chiave di sessione GLOBALE (non per tool): il punto del progetto
 * libro è proprio ricordare la stessa scelta passando da un tool all'altro
 * nella stessa scheda del browser — una chiave per tool vanificherebbe la
 * continuità che il progetto libro esiste per dare.
 */
const SELECTED_KEY = "inkforge.bookProject.selected";

export type BookProjectRow = {
  id: string;
  name: string;
  cover_path: string | null;
  cover_mime: string | null;
  interior_path: string | null;
  updated_at: string;
  expires_at: string;
};

function readStoredSelection(): string | null {
  try {
    return sessionStorage.getItem(SELECTED_KEY);
  } catch {
    return null;
  }
}

function writeStoredSelection(id: string | null) {
  try {
    if (id) sessionStorage.setItem(SELECTED_KEY, id);
    else sessionStorage.removeItem(SELECTED_KEY);
  } catch {
    // sessionStorage non disponibile (es. modalità privata): la scelta non sopravvive
    // al cambio tool in questa sessione, non è un problema bloccante.
  }
}

export function useBookProject() {
  const queryClient = useQueryClient();
  const fetchList = useServerFn(listMyBookProjects);
  const upsert = useServerFn(upsertBookProject);
  const remove = useServerFn(deleteBookProject);

  const [userId, setUserId] = useState<string | null>(null);
  const [selectedId, setSelectedIdState] = useState<string | null>(() => readStoredSelection());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
  }, []);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["book-projects"],
    queryFn: async () => (await fetchList()) as unknown as BookProjectRow[],
  });

  // Con un solo progetto esistente non c'è vera ambiguità: si preseleziona per comodità.
  // Con 2+ progetti e nessuna scelta fatta finora in questa sessione, resta non selezionato:
  // è qui che si "chiede quale progetto usare" invece di indovinare.
  useEffect(() => {
    if (selectedId === null && projects && projects.length === 1) {
      setSelectedId(projects[0]!.id);
    }
  }, [projects, selectedId]);

  function setSelectedId(id: string | null) {
    setSelectedIdState(id);
    writeStoredSelection(id);
  }

  const selectedProject = projects?.find((p) => p.id === selectedId) ?? null;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["book-projects"] });
  }

  /** Seleziona un progetto (o null per "nessuno") e scarica subito i suoi file, pronti da passare al tool. */
  async function selectAndLoad(
    id: string | null,
  ): Promise<{ cover: File | null; interior: File | null }> {
    setSelectedId(id);
    const project = id ? (projects?.find((p) => p.id === id) ?? null) : null;
    if (!project) return { cover: null, interior: null };

    const [cover, interior] = await Promise.all([
      project.cover_path
        ? downloadProjectFile(
            project.cover_path,
            `${project.name} — copertina.${project.cover_path.split(".").pop()}`,
          )
        : Promise.resolve(null),
      project.interior_path
        ? downloadProjectFile(project.interior_path, `${project.name} — interno.pdf`)
        : Promise.resolve(null),
    ]);
    return { cover, interior };
  }

  async function createProject(name: string): Promise<string> {
    const created = await upsert({ data: { name } });
    invalidate();
    setSelectedId(created.id);
    return created.id;
  }

  async function renameProject(id: string, name: string): Promise<void> {
    await upsert({ data: { id, name } });
    invalidate();
  }

  /** Carica su Storage i file passati e aggiorna i metadati del progetto selezionato. Nessun effetto se nessun progetto è selezionato. */
  async function saveFiles(cover: File | null, interior: File | null): Promise<void> {
    if (!selectedId || !userId) return;
    const [coverResult, interiorResult] = await Promise.all([
      cover ? uploadProjectFile(userId, selectedId, "cover", cover) : Promise.resolve(null),
      interior
        ? uploadProjectFile(userId, selectedId, "interior", interior)
        : Promise.resolve(null),
    ]);
    await upsert({
      data: {
        id: selectedId,
        name: selectedProject?.name ?? "Progetto senza nome",
        ...(coverResult ? { coverPath: coverResult.path, coverMime: coverResult.mime } : {}),
        ...(interiorResult ? { interiorPath: interiorResult.path } : {}),
      },
    });
    invalidate();
  }

  async function removeProject(id: string): Promise<void> {
    const project = projects?.find((p) => p.id === id);
    if (project) await removeProjectFiles([project.cover_path, project.interior_path]);
    await remove({ data: { id } });
    if (selectedId === id) setSelectedId(null);
    invalidate();
  }

  return {
    projects: projects ?? [],
    isLoading,
    selectedId,
    selectedProject,
    userId,
    setSelectedId,
    selectAndLoad,
    createProject,
    renameProject,
    saveFiles,
    removeProject,
  };
}

export type UseBookProjectReturn = ReturnType<typeof useBookProject>;
