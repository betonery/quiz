import {
  defaultFlowLayout,
  flowLayoutSchema,
  normalizeFlowSourceHandle,
  normalizeFlowTargetHandle,
  type FlowLayout,
} from "@/domains/quiz/types/flow.types";

function normalizeStoredFlowLayout(layout: FlowLayout): FlowLayout {
  return {
    ...layout,
    visualEdges: layout.visualEdges.map((edge) => ({
      ...edge,
      sourceHandle: normalizeFlowSourceHandle(edge.sourceHandle, edge.source),
      targetHandle: normalizeFlowTargetHandle(edge.targetHandle, edge.target),
    })),
  };
}

export function parseFlowLayout(raw: unknown): FlowLayout {
  const parsed = flowLayoutSchema.safeParse(raw);
  if (!parsed.success) return defaultFlowLayout;
  return normalizeStoredFlowLayout(parsed.data);
}
