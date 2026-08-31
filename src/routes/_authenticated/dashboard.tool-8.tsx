import { createFileRoute } from "@tanstack/react-router";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { PromoTool } from "@/components/tools/promo/PromoTool";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(8)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-8")({
  head: () => ({
    meta: [
      { title: `${tool.name} — InkForgeKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <PromoTool runtime={runtime} />}</ToolPageShell>,
});
