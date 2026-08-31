import { Link } from "@tanstack/react-router";
import { ArrowRight, Languages, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden">
      <div className="hero-aura aura-violet -top-32 left-[10%] size-[28rem]" aria-hidden />
      <div className="hero-aura aura-green -top-10 right-[5%] size-[22rem] opacity-25" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <Badge variant="outline" className="border-border bg-gradient-brand-soft text-foreground">
          {t("hero.eyebrow")}
        </Badge>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          {t("hero.headline1")} <span className="text-gradient">{t("hero.headline2")}</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {t("hero.sub")}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            asChild
            className="bg-gradient-brand w-full text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              {t("hero.cta1")}
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/pricing">{t("hero.cta2")}</Link>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Languages className="size-3.5 text-accent" /> {t("hero.badge1")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-accent" /> {t("hero.badge2")}
          </span>
        </div>
      </div>
    </section>
  );
}
