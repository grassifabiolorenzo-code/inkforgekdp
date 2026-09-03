import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { installAnalytics } from "@/lib/analytics";
import { getStoredConsent, onConsentReopenRequested, setStoredConsent } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";

/**
 * Banner di consenso per gli strumenti di analisi opzionali (PostHog, Google
 * Analytics — non Sentry, vedi consent.ts). Mostrato finché l'utente non fa
 * una scelta esplicita: niente "X" per chiuderlo senza decidere, perché sotto
 * GDPR/ePrivacy solo un'azione esplicita (accetta/rifiuta) conta come scelta
 * — ignorare il banner non deve mai essere equivalente ad accettare.
 */
export function ConsentBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) setVisible(true);

    // "Preferenze cookie" nel footer riapre il banner senza dover ricaricare la pagina.
    return onConsentReopenRequested(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (getStoredConsent() === "accepted") installAnalytics();
  }, []);

  function handleAccept() {
    setStoredConsent("accepted");
    installAnalytics();
    setVisible(false);
  }

  function handleReject() {
    setStoredConsent("rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("consent.title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{t("consent.title")}</p>
          <p className="text-xs text-muted-foreground">
            {t("consent.description")}{" "}
            <Link to="/privacy" className="underline hover:text-foreground">
              {t("consent.privacyLink")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleReject}>
            {t("consent.reject")}
          </Button>
          <Button size="sm" onClick={handleAccept}>
            {t("consent.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
