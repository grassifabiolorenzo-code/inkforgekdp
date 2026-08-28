import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            La suite di strumenti per chi pubblica su Amazon KDP: copertine, listing, contenuti A+ e
            triage immagini.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">Prodotto</p>
          <Link to="/" className="block text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link to="/pricing" className="block text-muted-foreground hover:text-foreground">
            Prezzi
          </Link>
          <Link to="/faq" className="block text-muted-foreground hover:text-foreground">
            FAQ
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">Account</p>
          <Link to="/auth" className="block text-muted-foreground hover:text-foreground">
            Accedi
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="block text-muted-foreground hover:text-foreground"
          >
            Registrati
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">Legale</p>
          <Link to="/privacy" className="block text-muted-foreground hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/terms" className="block text-muted-foreground hover:text-foreground">
            Termini e condizioni
          </Link>
        </div>
      </div>
      <div className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} OP+studioKdp. Tutti i diritti riservati.
      </div>
    </footer>
  );
}
