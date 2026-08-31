import { createFileRoute } from "@tanstack/react-router";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { BlurbTool } from "@/components/tools/blurb/BlurbTool";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(6)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-6")({
  head: () => ({
    meta: [
      { title: `${tool.name} — InkForgeKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <BlurbTool runtime={runtime} />}</ToolPageShell>,
});
