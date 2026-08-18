"use client";

import { FlowCanvas } from "@/domains/quiz/components/flow/flow-canvas";
import { FlowFloatingActions } from "@/domains/quiz/components/flow/flow-floating-actions";

export function FlowPanel() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-950">
      <FlowFloatingActions />
      <FlowCanvas />
    </div>
  );
}
