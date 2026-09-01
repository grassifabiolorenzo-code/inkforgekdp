import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDangerDialog } from "@/components/admin/ConfirmDangerDialog";
import {
  getReferralProgramKpis,
  getSuspiciousReferrals,
  listAdminReferrals,
  markReferralChargeback,
  suspendReferral,
} from "@/lib/admin/referral.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_admin/admin/referrals")({
  head: () => ({
    meta: [{ title: "Referral — Admin InkForgeKdp" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminReferralsPage,
});

const STATUS_VARIANT: Record<string, "default" | "outline" | "destructive" | "secondary"> = {
  ACTIVE: "default",
  REGISTERED: "secondary",
  CANCELLED: "outline",
  REFUNDED: "destructive",
  CHARGEBACK: "destructive",
  SUSPENDED: "destructive",
};

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function AdminReferralsPage() {
  const queryClient = useQueryClient();
  const fetchReferrals = useServerFn(listAdminReferrals);
  const fetchKpis = useServerFn(getReferralProgramKpis);
  const fetchSuspicious = useServerFn(getSuspiciousReferrals);
  const suspend = useServerFn(suspendReferral);
  const chargeback = useServerFn(markReferralChargeback);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; email: string | null } | null>(
    null,
  );
  const pageSize = 25;

  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["admin-referral-kpis"],
    queryFn: () => fetchKpis(),
  });
  const { data: suspicious } = useQuery({
    queryKey: ["admin-referral-suspicious"],
    queryFn: () => fetchSuspicious(),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-referrals", search, statusFilter, page],
    queryFn: () =>
      fetchReferrals({
        data: { search: search || undefined, status: statusFilter || undefined, page, pageSize },
      }),
  });

  async function handleSuspend() {
    if (!suspendTarget) return;
    try {
      await suspend({
        data: { referredUserId: suspendTarget.id, reason: "Sospensione manuale da admin" },
      });
      toast.success("Referral sospeso");
      setSuspendTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-kpis"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  async function handleChargeback(referredUserId: string) {
    try {
      await chargeback({ data: { referredUserId } });
      toast.success("Chargeback registrato, crediti stornati");
      void queryClient.invalidateQueries({ queryKey: ["admin-referrals"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-referral-kpis"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operazione non riuscita");
    }
  }

  return (
    <AdminShell
      title="Programma referral"
      description="Referral, crediti distribuiti e sconti sull'abbonamento attivi"
      breadcrumb={["Admin", "Referral"]}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {loadingKpis || !kpis ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Referral totali" value={String(kpis.total_referrals)} />
            <KpiCard label="Attivi" value={String(kpis.active_referrals)} />
            <KpiCard label="Cancellati/rimborsati" value={String(kpis.cancelled_referrals)} />
            <KpiCard label="In attesa" value={String(kpis.pending_referrals)} />
            <KpiCard label="Conversion rate" value={`${kpis.conversion_rate}%`} />
            <KpiCard
              label="Crediti distribuiti"
              value={kpis.total_credits_distributed.toLocaleString("it-IT")}
            />
            <KpiCard
              label="Crediti stornati"
              value={kpis.total_credits_clawed_back.toLocaleString("it-IT")}
            />
            <KpiCard label="Utenti con abbonamento a €0" value={String(kpis.users_with_pro_free)} />
          </div>
        )}

        {suspicious && suspicious.length > 0 && (
          <Card className="border-amber-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4" />
                Referral sospetti da rivedere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {suspicious.map((s) => (
                  <li key={s.referrer_id} className="flex items-center justify-between">
                    <span>{s.referrer_email ?? s.referrer_id}</span>
                    <span className="text-muted-foreground">
                      {s.referred_count} registrazioni mai convertite in pagamento
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Cerca per email referrer o invitato…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) => {
              setStatusFilter(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="REGISTERED">Registrato</SelectItem>
              <SelectItem value="ACTIVE">Attivo</SelectItem>
              <SelectItem value="CANCELLED">Cancellato</SelectItem>
              <SelectItem value="REFUNDED">Rimborsato</SelectItem>
              <SelectItem value="CHARGEBACK">Chargeback</SelectItem>
              <SelectItem value="SUSPENDED">Sospeso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Invitato</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Crediti</TableHead>
                <TableHead>Creato il</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data?.referrals.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    Nessun referral trovato.
                  </TableCell>
                </TableRow>
              )}
              {data?.referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.referrer_email}</TableCell>
                  <TableCell className="text-sm">{r.referred_email}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.cycle_number ? `#${r.cycle_number} · ${r.position_in_cycle}/10` : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{r.reward_credits}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Azioni
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {r.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              setSuspendTarget({ id: r.referred_user_id, email: r.referred_email })
                            }
                          >
                            Sospendi
                          </DropdownMenuItem>
                        )}
                        {r.status === "ACTIVE" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleChargeback(r.referred_user_id)}
                          >
                            Segna chargeback
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-3">
            <AdminPagination
              page={page}
              pageSize={pageSize}
              totalCount={data?.totalCount ?? 0}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      <ConfirmDangerDialog
        open={!!suspendTarget}
        onOpenChange={(v) => !v && setSuspendTarget(null)}
        title="Sospendere questo referral?"
        description={`Il referral di ${suspendTarget?.email ?? ""} smetterà immediatamente di contare come attivo per il prezzo scontato del referrer. I crediti già erogati non vengono stornati (usa "Segna chargeback" per quello).`}
        confirmWord="SOSPENDI"
        actionLabel="Sospendi"
        onConfirm={handleSuspend}
      />
    </AdminShell>
  );
}
