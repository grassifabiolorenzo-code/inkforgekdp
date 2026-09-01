import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/admin/security")({
  head: () => ({
    meta: [{ title: "Sicurezza — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSecurityPage,
});

interface TotpFactor {
  id: string;
  status: "verified" | "unverified";
  friendly_name?: string | null;
}

async function fetchFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp ?? []) as TotpFactor[];
}

function AdminSecurityPage() {
  const queryClient = useQueryClient();
  const { data: factors, isLoading } = useQuery({
    queryKey: ["admin-mfa-factors"],
    queryFn: fetchFactors,
  });

  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TotpFactor | null>(null);

  const verifiedFactor = factors?.find((f) => f.status === "verified") ?? null;

  async function startEnrollment() {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setEnrollFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Attivazione non riuscita");
      setEnrolling(false);
    }
  }

  async function confirmEnrollment() {
    if (!enrollFactorId) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollFactorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      toast.success("Verifica in due passaggi attivata");
      setEnrolling(false);
      setEnrollFactorId(null);
      setQrCode(null);
      setSecret(null);
      setCode("");
      void queryClient.invalidateQueries({ queryKey: ["admin-mfa-factors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Codice non valido");
    } finally {
      setVerifying(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: removeTarget.id });
      if (error) throw error;
      toast.success("Verifica in due passaggi disattivata");
      setRemoveTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-mfa-factors"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Disattivazione non riuscita");
    }
  }

  return (
    <AdminShell
      title="Sicurezza"
      description="Verifica in due passaggi (2FA) per il tuo accesso admin"
      breadcrumb={["Admin", "Sicurezza"]}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {verifiedFactor ? (
                <ShieldCheck className="size-4 text-emerald-500" />
              ) : (
                <ShieldOff className="size-4 text-amber-500" />
              )}
              Verifica in due passaggi (TOTP)
            </CardTitle>
            <CardDescription>
              Richiede un'app come Google Authenticator, Authy o 1Password. Obbligatoria per le
              azioni amministrative più sensibili (gestione amministratori, eliminazione utenti).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <Skeleton className="h-20 w-full" />}

            {!isLoading && verifiedFactor && !enrolling && (
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Attiva</Badge>
                  <span className="text-sm text-muted-foreground">
                    {verifiedFactor.friendly_name || "App autenticatore"}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRemoveTarget(verifiedFactor)}
                >
                  Disattiva
                </Button>
              </div>
            )}

            {!isLoading && !verifiedFactor && !enrolling && (
              <Button onClick={startEnrollment}>Attiva verifica in due passaggi</Button>
            )}

            {enrolling && qrCode && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scansiona il QR code con la tua app autenticatore, poi inserisci il codice a 6
                  cifre.
                </p>
                <img
                  src={qrCode}
                  alt="QR code TOTP"
                  className="mx-auto h-48 w-48 rounded-lg border border-border bg-white p-2"
                />
                {secret && (
                  <p className="text-center font-mono text-xs text-muted-foreground">
                    Chiave manuale: {secret}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="mfa-enroll-code">Codice a 6 cifre</Label>
                    <Input
                      id="mfa-enroll-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      inputMode="numeric"
                    />
                  </div>
                  <Button
                    className="mt-6"
                    onClick={confirmEnrollment}
                    disabled={code.length !== 6 || verifying}
                  >
                    {verifying ? "Verifico…" : "Conferma"}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEnrolling(false);
                    setEnrollFactorId(null);
                    setQrCode(null);
                    setCode("");
                  }}
                >
                  Annulla
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDangerDialog
        open={!!removeTarget}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        title="Disattivare la verifica in due passaggi?"
        description="Il tuo account admin resterà accessibile con la sola password. Le azioni più sensibili (gestione amministratori, eliminazione utenti) resteranno bloccate finché non riattivi il 2FA."
        confirmWord="DISATTIVA"
        actionLabel="Disattiva"
        onConfirm={handleRemove}
      />
    </AdminShell>
  );
}
