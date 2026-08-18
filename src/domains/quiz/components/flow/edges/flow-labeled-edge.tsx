"use client";

import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { FlowEdgeData } from "@/domains/quiz/utils/flow-graph.utils";

export function FlowLabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps) {
  const edgeData = data as FlowEdgeData | undefined;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeKind = edgeData?.edgeKind ?? "navigation";
  const strokeColor = edgeKind === "orphan" ? "#ef4444" : "#3b82f6";

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: strokeColor,
        strokeWidth: 2,
        strokeDasharray: undefined,
      }}
    />
  );
}
