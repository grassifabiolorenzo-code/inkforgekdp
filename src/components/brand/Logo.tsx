import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="bg-gradient-brand flex size-8 items-center justify-center rounded-lg text-sm font-black text-primary-foreground">
        IF
      </span>
      {!compact && (
        <span className="text-base">
          <span className="text-gradient font-black">InkForge</span>
          <span className="text-foreground">Kdp</span>
        </span>
      )}
    </span>
  );
}
