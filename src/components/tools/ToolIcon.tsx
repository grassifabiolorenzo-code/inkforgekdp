import { BookOpen, FileText, Image as ImageIcon, LayoutGrid, Layers, Megaphone, Sparkles, User } from "lucide-react";

import type { ToolConfig } from "@/config/tools";
import { cn } from "@/lib/utils";

const ICONS = {
  image: ImageIcon,
  "file-text": FileText,
  sparkles: Sparkles,
  layers: Layers,
  "layout-grid": LayoutGrid,
  "book-open": BookOpen,
  user: User,
  megaphone: Megaphone,
} as const;

export function ToolIcon({
  tool,
  size = "md",
  className,
}: {
  tool: ToolConfig;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = ICONS[tool.icon];
  const box = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-11";
  const inner = size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5";

  return (
    <span className={cn("icon-tile shrink-0", box, className)}>
      <Icon className={cn(inner, "text-accent")} />
    </span>
  );
}
