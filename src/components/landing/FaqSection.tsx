import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ_ITEMS = [
  {
    q: "Cosa include l'abbonamento?",
    a: "Tutti i piani includono Copertine, Pubblicazione e Triage. A+ KDPstudio è riservato ai piani Pro e Business. La differenza tra i piani riguarda quindi i tool inclusi e il numero di utilizzi mensili (50 con Starter, 300 con Pro, illimitati con Business).",
  },
  {
    q: "Come funziona il consumo dei crediti?",
    a: "Un credito viene scalato solo al completamento dell'operazione finale: esportazione dell'immagine per Copertine, ogni generazione completata per Pubblicazione e A+ KDPstudio, download delle tre cartelle per Triage. Aprire il tool, modificare gli input o vedere l'anteprima non consuma nulla, e le operazioni fallite non vengono addebitate.",
  },
  {
    q: "Come funziona il bonus del primo mese Starter?",
    a: "Al primo abbonamento Starter ricevi +50 utilizzi bonus, per un totale di 100 utilizzi nel primo periodo. Dal secondo periodo torni automaticamente a 50 utilizzi al mese. Il bonus viene assegnato una sola volta e non viene riattribuito in caso di cancellazione e riattivazione.",
  },
  {
    q: "Cosa succede se raggiungo il limite mensile?",
    a: "Il sistema blocca le operazioni a pagamento e ti propone il passaggio al piano superiore. I crediti si azzerano e si rinnovano automaticamente a ogni rinnovo del periodo di abbonamento.",
  },
  {
    q: "I crediti non utilizzati si accumulano?",
    a: "No. A ogni rinnovo il contatore viene azzerato e ricevi i crediti previsti dal tuo piano.",
  },
  {
    q: "Come gestisco pagamenti e cancellazione?",
    a: "Pagamenti, rinnovi, upgrade e cancellazioni sono gestiti tramite Lemon Squeezy. Dall'area Abbonamento puoi aprire il portale cliente e gestire tutto in autonomia.",
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight">
        Domande <span className="text-gradient">frequenti</span>
      </h2>
      <Accordion type="single" collapsible className="mt-10">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem key={item.q} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
