import { Link } from "@tanstack/react-router";
import { Compass, FileText, Image, Layers } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TOOLS } from "@/config/tools";

const copertine = TOOLS.find((t) => t.id === "copertine")!;
const pubblicazione = TOOLS.find((t) => t.id === "pubblicazione")!;
const interni = TOOLS.find((t) => t.id === "interni")!;

const STARTING_POINTS = [
  {
    icon: Image,
    question: "Devi ancora creare la copertina?",
    answer: "Inizia da Copertine: guide di bleed, dorso e margini di sicurezza già pronte per KDP.",
    tool: copertine,
  },
  {
    icon: FileText,
    question: "Copertina e testo pronti, manca la scheda prodotto?",
    answer:
      "Usa Pubblicazione per generare titolo, descrizione e keyword ottimizzate in pochi secondi.",
    tool: pubblicazione,
  },
  {
    icon: Layers,
    question: "Hai un PDF da impaginare per l'interno del libro?",
    answer:
      "Interni lo trasforma in un PDF pronto per KDP, con margini e ridimensionamento automatici.",
    tool: interni,
  },
];

const DISMISSED_KEY_PREFIX = "inkforge.onboarding.dismissed.";

function isDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}

function markDismissed(userId: string): void {
  try {
    localStorage.setItem(DISMISSED_KEY_PREFIX + userId, "1");
  } catch {
    // Storage non disponibile (es. modalità privata): la guida ricomparirà, non è un problema bloccante.
  }
}

/**
 * Guida di benvenuto al primo accesso: si apre automaticamente una sola volta per utente
 * (localStorage, non un dato di account — riaprirla su un altro dispositivo non è un problema),
 * e resta richiamabile in qualsiasi momento dal pulsante "Guida introduttiva" nella dashboard.
 */
export function FirstRunGuide({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isDismissed(userId)) setOpen(true);
  }, [userId]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) markDismissed(userId);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Compass className="mr-1.5 size-4" />
        Guida introduttiva
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Benvenuto su InkForgeKdp</DialogTitle>
            <DialogDescription>
              Un credito viene scalato solo quando completi con successo un'operazione: nessun
              addebito per i tentativi falliti. Trovi crediti e piano in Abbonamento, in qualsiasi
              momento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Da dove iniziare</p>
            {STARTING_POINTS.map(({ icon: Icon, question, answer, tool }) => (
              <Link
                key={tool.id}
                to={tool.route}
                onClick={() => handleOpenChange(false)}
                className="flex items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/40"
              >
                <span className="icon-tile mt-0.5 size-9 shrink-0">
                  <Icon className="size-4 text-accent" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">{question}</span>
                  <span className="block text-xs text-muted-foreground">{answer}</span>
                </span>
              </Link>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)}>Ho capito, iniziamo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
