import { createFileRoute } from "@tanstack/react-router";

import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { TriageTool } from "@/components/tools/triage/TriageTool";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(4)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-4")({
  head: () => ({
    meta: [
      { title: `${tool.name} — OP+studioKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <TriageTool runtime={runtime} />}</ToolPageShell>,
});
