import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo.png"
      alt="InkForgeKdp — Create. Publish. Inspire."
      className={cn("h-8 w-auto", className)}
    />
  );
}
