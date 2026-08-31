import { createFileRoute } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LoadingState } from "@/components/dashboard/StateBanners";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/hooks/useAccount";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({
    meta: [
      { title: "Profilo — InkForgeKdp" },
      { name: "description", content: "I dati del tuo account InkForgeKdp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const account = useAccount();
  const profile = account.data?.profile;

  return (
    <DashboardShell title="Profilo" description="I dati del tuo account">
      <div className="mx-auto max-w-xl space-y-6">
        {account.isLoading && <LoadingState />}
        {profile && (
          <div className="panel space-y-5 p-6">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <p className="text-sm text-muted-foreground">{profile.name ?? "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{profile.email ?? "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Account creato il</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString("it-IT")}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
