import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { signOut } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Impostazioni — InkForgeKdp" },
      { name: "description", content: "Preferenze account e sessione." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();

  return (
    <DashboardShell title="Impostazioni" description="Sessione e documenti">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="panel space-y-3 p-6">
          <h2 className="font-semibold">Documenti</h2>
          <div className="flex gap-3 text-sm">
            <Link to="/terms" className="underline hover:text-foreground">
              Termini
            </Link>
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>

        <div className="panel space-y-3 p-6">
          <h2 className="font-semibold">Sessione</h2>
          <p className="text-sm text-muted-foreground">
            Esci da questo dispositivo. Potrai rientrare in qualsiasi momento.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
          >
            Esci
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}
