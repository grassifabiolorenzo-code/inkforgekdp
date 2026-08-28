import { Check, Minus } from "lucide-react";

import { PLANS } from "@/config/plans";
import { TOOLS } from "@/config/tools";

export function ComparisonTable() {
  const rows = [
    ...TOOLS.map((tool) => ({
      label: tool.name,
      values: PLANS.map(() => "check" as const),
    })),
    {
      label: "Utilizzi / mese",
      values: PLANS.map((p) => (p.unlimited ? "Illimitati" : String(p.monthlyLimit))),
    },
    {
      label: "Bonus primo mese",
      values: PLANS.map((p) => (p.firstMonthBonus > 0 ? `+${p.firstMonthBonus}` : "dash" as const)),
    },
  ];

  const renderValue = (value: string) => {
    if (value === "check") return <Check className="mx-auto size-4 text-accent" />;
    if (value === "dash") return <Minus className="mx-auto size-4 text-muted-foreground" />;
    return <span className="font-medium">{value}</span>;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        Confronto dei <span className="text-gradient">piani</span>
      </h2>

      {/* Desktop / tablet */}
      <div className="panel mt-10 hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left font-medium text-muted-foreground">Caratteristica</th>
              {PLANS.map((p) => (
                <th key={p.slug} className="p-4 text-center font-semibold">
                  {p.name}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface">
              <td className="p-4 text-left text-muted-foreground">Prezzo</td>
              {PLANS.map((p) => (
                <td key={p.slug} className="p-4 text-center font-semibold">
                  €{p.price}/mese
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/60 last:border-0">
                <td className="p-4 text-left text-muted-foreground">{row.label}</td>
                {row.values.map((v, i) => (
                  <td key={`${row.label}-${i}`} className="p-4 text-center">
                    {renderValue(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: una card per piano */}
      <div className="mt-8 space-y-4 sm:hidden">
        {PLANS.map((plan, planIndex) => (
          <div key={plan.slug} className="panel p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">{plan.name}</h3>
              <span className="text-sm font-semibold">€{plan.price}/mese</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right">{renderValue(row.values[planIndex] ?? "dash")}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
