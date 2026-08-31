import { createFileRoute } from "@tanstack/react-router";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { BioTool } from "@/components/tools/bio/BioTool";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(7)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-7")({
  head: () => ({
    meta: [
      { title: `${tool.name} — InkForgeKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <BioTool runtime={runtime} />}</ToolPageShell>,
});
