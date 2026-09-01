import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, MailX } from "lucide-react";
import { useState } from "react";

import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { Button } from "@/components/ui/button";
import { processUnsubscribe } from "@/lib/unsubscribe.functions";

const title = "Disiscrizione — InkForgeKdp";

export const Route = createFileRoute("/unsubscribe/$token")({
  head: () => ({
    meta: [{ title }, { name: "robots", content: "noindex" }],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useParams();
  const unsubscribe = useServerFn(processUnsubscribe);
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [notFound, setNotFound] = useState(false);

  async function handleConfirm() {
    setState("pending");
    try {
      const result = await unsubscribe({ data: { token } });
      if (result.kind === "not_found") setNotFound(true);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        {state !== "done" && (
          <>
            <span className="icon-tile mx-auto size-14">
              <MailX className="size-6 text-accent" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Vuoi disiscriverti?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Non riceverai più le nostre email promozionali. Le comunicazioni relative al tuo
              abbonamento (fatture, avvisi di pagamento) continueranno comunque a essere inviate.
            </p>
            <Button className="mt-6" onClick={handleConfirm} disabled={state === "pending"}>
              {state === "pending" ? "Attendi…" : "Conferma disiscrizione"}
            </Button>
            {state === "error" && (
              <p className="mt-4 text-sm text-destructive">
                Non siamo riusciti a completare l'operazione. Riprova tra qualche istante.
              </p>
            )}
          </>
        )}

        {state === "done" && (
          <>
            <span className="icon-tile mx-auto size-14">
              <CheckCircle2 className="size-6 text-accent" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              {notFound ? "Link non valido" : "Disiscrizione completata"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {notFound
                ? "Questo link di disiscrizione non è (più) valido: potresti già esserti disiscritto in precedenza."
                : "Non riceverai più email promozionali da InkForgeKdp."}
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
