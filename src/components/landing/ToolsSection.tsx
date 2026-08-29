import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { TOOLS } from "@/config/tools";
import { useI18n, useToolCopy } from "@/lib/i18n";

export function ToolsSection() {
  const { t } = useI18n();
  const copyOf = useToolCopy();

  return (
    <section id="tool" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="border-border bg-gradient-brand-soft text-foreground">
          {t("tools.badge")}
        </Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {t("tools.title1")} <span className="text-gradient">{t("tools.title2")}</span>
        </h2>
        <p className="mt-3 text-muted-foreground">{t("tools.sub")}</p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const copy = copyOf(tool.id);
          return (
            <article key={tool.id} className="panel group flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <ToolIcon tool={tool} size="lg" />
                <Badge variant="secondary" className="text-xs">
                  {t("tools.slot", { n: tool.slot })}
                </Badge>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{copy.name}</h3>
                <p className="text-sm text-muted-foreground">{copy.description}</p>
                <p className="text-sm text-accent">{copy.benefit}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("tools.cost", { event: copy.creditEvent.toLowerCase() })}
              </p>
              <div className="mt-auto pt-2">
                <Button variant="ghost" size="sm" asChild className="px-0 hover:bg-transparent">
                  <Link to="/faq" className="text-accent">
                    {t("tools.more")}
                    <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
