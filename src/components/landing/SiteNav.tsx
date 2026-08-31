import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

const links: { to: string; key: MessageKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/prova", key: "nav.demo" },
  { to: "/pricing", key: "nav.pricing" },
  { to: "/faq", key: "nav.faq" },
];

export function SiteNav() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" aria-label="InkForgeKdp home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher variant="full" />
          {user ? (
            <Button asChild>
              <Link to="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">{t("nav.login")}</Link>
              </Button>
              <Button asChild className="bg-gradient-brand text-primary-foreground hover:opacity-90">
                <Link to="/auth" search={{ mode: "signup" }}>
                  {t("nav.signup")}
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LanguageSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("nav.menu")}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-sidebar">
              <div className="mt-8 flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {t(l.key)}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link to="/dashboard">{t("nav.dashboard")}</Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild onClick={() => setOpen(false)}>
                        <Link to="/auth">{t("nav.login")}</Link>
                      </Button>
                      <Button
                        asChild
                        onClick={() => setOpen(false)}
                        className="bg-gradient-brand text-primary-foreground"
                      >
                        <Link to="/auth" search={{ mode: "signup" }}>
                          {t("nav.signup")}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
