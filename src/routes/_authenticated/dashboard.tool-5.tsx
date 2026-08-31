import { createFileRoute } from "@tanstack/react-router";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { InterniTool } from "@/components/tools/interni/InterniTool";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(5)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-5")({
  head: () => ({
    meta: [
      { title: `${tool.name} — InkForgeKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <InterniTool runtime={runtime} />}</ToolPageShell>,
});
