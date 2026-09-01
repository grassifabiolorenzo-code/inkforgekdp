import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface ChallengeSearch {
  redirect?: string;
}

/**
 * Step-up MFA per l'area admin: fuori dal layout `_admin` di proposito, per
 * evitare che il guard di `_admin` (che reindirizza qui quando serve aal2)
 * finisca per reindirizzare a se stesso in loop.
 */
export const Route = createFileRoute("/admin-mfa-challenge")({
  validateSearch: (search: Record<string, unknown>): ChallengeSearch => {
    const parsed: ChallengeSearch = {};
    if (typeof search["redirect"] === "string") parsed.redirect = search["redirect"];
    return parsed;
  },
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: {} });
  },
  head: () => ({
    meta: [
      { title: "Verifica in due passaggi — InkForgeKdp" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MfaChallengePage,
});

function MfaChallengePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const factor = factors?.totp.find((f) => f.status === "verified");
      if (!factor) throw new Error("Nessun fattore di verifica attivo trovato.");

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      void navigate({ to: search.redirect || "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Codice non valido");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <ShieldCheck className="mx-auto size-10 text-accent" />
        <div>
          <h1 className="text-xl font-semibold">Verifica in due passaggi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inserisci il codice a 6 cifre della tua app autenticatore per accedere al back office.
          </p>
        </div>
        <div className="space-y-1.5 text-left">
          <Label htmlFor="mfa-challenge-code">Codice</Label>
          <Input
            id="mfa-challenge-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && code.length === 6 && void handleVerify()}
          />
        </div>
        <Button className="w-full" onClick={handleVerify} disabled={code.length !== 6 || verifying}>
          {verifying ? "Verifico…" : "Verifica"}
        </Button>
      </div>
    </div>
  );
}
