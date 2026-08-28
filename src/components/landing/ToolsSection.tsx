import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/ToolIcon";
import { TOOLS } from "@/config/tools";

export function ToolsSection() {
  return (
    <section id="tool" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="border-border bg-gradient-brand-soft text-foreground">
          I 4 tool della piattaforma
        </Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Quattro strumenti, <span className="text-gradient">un solo flusso di lavoro</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Tutti e quattro i tool sono inclusi in ogni piano. Cambia soltanto il numero di utilizzi
          mensili.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <article key={tool.id} className="panel group flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <ToolIcon tool={tool} size="lg" />
              <Badge variant="secondary" className="text-xs">
                Tool {tool.slot}
              </Badge>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{tool.name}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
              <p className="text-sm text-accent">{tool.benefit}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Consumo: 1 credito — {tool.creditEvent.toLowerCase()}.
            </p>
            <div className="mt-auto pt-2">
              <Button variant="ghost" size="sm" asChild className="px-0 hover:bg-transparent">
                <Link to="/faq" className="text-accent">
                  Scopri di più
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
