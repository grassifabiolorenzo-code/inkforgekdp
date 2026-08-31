import { createFileRoute } from "@tanstack/react-router";

import { CopertineTool } from "@/components/tools/copertine/CopertineTool";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(1)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-1")({
  head: () => ({
    meta: [
      { title: `${tool.name} — InkForgeKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <CopertineTool runtime={runtime} />}</ToolPageShell>,
});
