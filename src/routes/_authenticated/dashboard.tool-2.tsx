import { createFileRoute } from "@tanstack/react-router";

import { PubblicazioneTool } from "@/components/tools/pubblicazione/PubblicazioneTool";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(2)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-2")({
  head: () => ({
    meta: [
      { title: `${tool.name} — InkForgeKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ToolPageShell tool={tool}>{(runtime) => <PubblicazioneTool runtime={runtime} />}</ToolPageShell>
  ),
});
