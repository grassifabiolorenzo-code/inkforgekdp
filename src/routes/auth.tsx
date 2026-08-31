import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const title = "Accedi o registrati — InkForgeKdp";
const description =
  "Accedi a InkForgeKdp per usare i tool Copertine, Pubblicazione, A+ KDPstudio e Triage.";

interface AuthSearch {
  mode?: "login" | "signup";
  plan?: string;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const parsed: AuthSearch = {};
    if (search["mode"] === "signup" || search["mode"] === "login") parsed.mode = search["mode"];
    if (typeof search["plan"] === "string") parsed.plan = search["plan"];
    return parsed;
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, plan } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const destination = plan ? `/dashboard/subscription` : "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success("Account creato. Controlla la tua email se richiesta la conferma.");
        const { data: session } = await supabase.auth.getSession();
        if (session.session) navigate({ to: destination });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: destination });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operazione non riuscita");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Accesso con Google non riuscito");
      return;
    }
    if (result.redirected) return;
    navigate({ to: destination });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="hero-aura aura-violet -top-20 left-1/4 size-96" aria-hidden />
      <div className="hero-aura aura-green bottom-0 right-1/4 size-80 opacity-20" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
        </div>

        <div className="panel p-7">
          <h1 className="text-xl font-semibold">
            {isSignup ? "Crea il tuo account" : "Bentornato"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Un solo account per tutti e 4 i tool."
              : "Accedi per continuare a lavorare."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Almeno 8 caratteri"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-brand w-full text-primary-foreground hover:opacity-90"
            >
              {loading ? "Attendi…" : isSignup ? "Crea account" : "Accedi"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            oppure
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continua con Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Hai già un account?" : "Non hai un account?"}{" "}
            <button
              type="button"
              className="text-accent hover:underline"
              onClick={() => setIsSignup((v) => !v)}
            >
              {isSignup ? "Accedi" : "Registrati"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Continuando accetti i{" "}
          <Link to="/terms" className="underline hover:text-foreground">
            Termini
          </Link>{" "}
          e la{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
