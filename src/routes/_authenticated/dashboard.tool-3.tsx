import { createFileRoute } from "@tanstack/react-router";

import { APlusTool } from "@/components/tools/aplus/APlusTool";
import { ToolPageShell } from "@/components/tools/ToolPageShell";
import { getToolBySlot } from "@/config/tools";

const tool = getToolBySlot(3)!;

export const Route = createFileRoute("/_authenticated/dashboard/tool-3")({
  head: () => ({
    meta: [
      { title: `${tool.name} — OP+studioKdp` },
      { name: "description", content: tool.description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ToolPageShell tool={tool}>{(runtime) => <APlusTool runtime={runtime} />}</ToolPageShell>,
});
