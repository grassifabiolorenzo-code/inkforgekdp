import { History, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UseGenerationHistoryReturn } from "@/hooks/useGenerationHistory";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Pannello condiviso di cronologia: ogni voce è una generazione già pagata,
 * ricaricabile senza consumare un nuovo credito. "Carica" ripristina sia
 * l'input che l'output così l'utente può anche modificare i campi e
 * rigenerare, non solo rileggere il risultato.
 */
export function GenerationHistoryPanel<TInput, TOutput>({
  history,
  onRestore,
}: {
  history: UseGenerationHistoryReturn<TInput, TOutput>;
  onRestore: (input: TInput, output: TOutput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) void history.load();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await history.removeEntry(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eliminazione non riuscita");
    } finally {
      setDeletingId(null);
    }
  }

  function handleRestore(entry: (typeof history.entries)[number]) {
    onRestore(entry.input, entry.output);
    setOpen(false);
    toast.success(`Caricato: ${entry.title}`);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-1.5 size-3.5" />
          Cronologia
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Cronologia generazioni</SheetTitle>
          <SheetDescription>
            Le tue ultime generazioni pagate su questo tool. Caricane una per rivederla o
            riprenderla da lì, senza consumare un nuovo credito.
          </SheetDescription>
        </SheetHeader>

        {history.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nessuna generazione salvata ancora.
          </p>
        ) : (
          <ScrollArea className="mt-4 h-[calc(100vh-14rem)] pr-3">
            <div className="space-y-2">
              {history.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <button
                    type="button"
                    onClick={() => handleRestore(entry)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)} · {entry.locale.toUpperCase()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === entry.id}
                    onClick={() => void handleDelete(entry.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
