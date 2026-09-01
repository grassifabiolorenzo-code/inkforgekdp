import { useServerFn } from "@tanstack/react-start";
import { Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { submitNewsletterLead } from "@/lib/leads.functions";

export function NewsletterSection() {
  const { t, locale } = useI18n();
  const submit = useServerFn(submitNewsletterLead);

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setStatus("pending");
    try {
      await submit({ data: { email, consent: true, locale } });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="panel-highlight glow-violet p-10 text-center">
        <span className="icon-tile mx-auto size-12">
          <Mail className="size-5 text-accent" />
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {t("newsletter.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("newsletter.subtitle")}</p>

        {status === "done" ? (
          <p className="mt-6 text-sm font-medium text-accent">{t("newsletter.success")}</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-6 flex max-w-md flex-col items-center gap-3"
          >
            <div className="flex w-full gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("newsletter.placeholder")}
              />
              <Button
                type="submit"
                disabled={status === "pending" || !consent}
                className="shrink-0"
              >
                {status === "pending" ? "…" : t("newsletter.cta")}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-left text-xs text-muted-foreground">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              {t("newsletter.consent")}
            </label>
            {status === "error" && (
              <p className="text-xs text-destructive">{t("newsletter.error")}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
