import { FileText, Image, Layers, Sparkles, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ToolConfig } from "@/config/tools";

const ICONS: Record<ToolConfig["icon"], LucideIcon> = {
  image: Image,
  "file-text": FileText,
  sparkles: Sparkles,
  layers: Layers,
};

export function ToolIcon({
  tool,
  className,
  size = "md",
}: {
  tool: ToolConfig;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = ICONS[tool.icon];
  const box = size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10";
  const inner = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";

  return (
    <span className={cn("icon-tile", box, className)}>
      <Icon className={cn(inner, "text-accent")} strokeWidth={1.75} />
    </span>
  );
}
