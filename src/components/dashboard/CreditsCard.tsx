import { Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CreditState } from "@/lib/credits.functions";

export function CreditsCard({ state }: { state: CreditState }) {
  if (state.unlimited) {
    return (
      <div className="panel-highlight glow-green space-y-3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">I tuoi crediti</p>
          <Badge className="badge-gradient text-[11px]">BUSINESS</Badge>
        </div>
        <p className="flex items-center gap-2 text-2xl font-black">
          <InfinityIcon className="size-7 text-accent" />
          Utilizzo illimitato
        </p>
        <p className="text-xs text-muted-foreground">
          Nessun limite mensile. Le operazioni vengono comunque registrate nello storico.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/usage">Visualizza utilizzo</Link>
        </Button>
      </div>
    );
  }

  const remaining = Math.max(state.remaining, 0);
  const percent = state.limit > 0 ? Math.min((state.used / state.limit) * 100, 100) : 0;

  return (
    <div className="panel space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">I tuoi crediti</p>
        {state.bonus_remaining > 0 && (
          <Badge variant="outline" className="gap-1 border-border text-[11px] text-accent">
            <Sparkles className="size-3" />
            {state.bonus_remaining} bonus
          </Badge>
        )}
      </div>

      <p className="text-3xl font-black tracking-tight">
        {state.used} <span className="text-lg font-medium text-muted-foreground">/ {state.limit}</span>
      </p>
      <Progress value={percent} className="h-2" />
      <p className="text-sm text-muted-foreground">
        Crediti rimanenti: <span className="font-semibold text-foreground">{remaining}</span>
      </p>

      <Button variant="outline" size="sm" asChild>
        <Link to="/dashboard/usage">Visualizza utilizzo</Link>
      </Button>
    </div>
  );
}
