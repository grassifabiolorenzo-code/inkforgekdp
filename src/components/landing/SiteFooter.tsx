import { Link } from "@tanstack/react-router";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/brand/Logo";
import { reopenConsentBanner } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
          <LanguageSwitcher variant="full" className="-ml-2" />
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">{t("footer.product")}</p>
          <Link to="/" className="block text-muted-foreground hover:text-foreground">
            {t("nav.home")}
          </Link>
          <Link to="/pricing" className="block text-muted-foreground hover:text-foreground">
            {t("nav.pricing")}
          </Link>
          <Link to="/faq" className="block text-muted-foreground hover:text-foreground">
            {t("nav.faq")}
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">{t("footer.account")}</p>
          <Link to="/auth" className="block text-muted-foreground hover:text-foreground">
            {t("nav.login")}
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="block text-muted-foreground hover:text-foreground"
          >
            {t("nav.register")}
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">{t("footer.legal")}</p>
          <Link to="/privacy" className="block text-muted-foreground hover:text-foreground">
            {t("footer.privacy")}
          </Link>
          <Link to="/terms" className="block text-muted-foreground hover:text-foreground">
            {t("footer.terms")}
          </Link>
          <Link to="/status" className="block text-muted-foreground hover:text-foreground">
            {t("footer.status")}
          </Link>
          <button
            type="button"
            onClick={reopenConsentBanner}
            className="block text-muted-foreground hover:text-foreground"
          >
            {t("footer.cookiePrefs")}
          </button>
        </div>
      </div>
      <div className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} InkForgeKdp. {t("footer.rights")}
      </div>
    </footer>
  );
}
