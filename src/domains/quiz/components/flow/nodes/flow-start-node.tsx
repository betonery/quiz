"use client";

import { Handle, Position } from "@xyflow/react";
import { Flag } from "lucide-react";

export function FlowStartNode() {
  return (
    <div className="relative overflow-visible">
      <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 shadow-sm">
        <Flag className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Início</span>
        <Handle
          type="source"
          position={Position.Right}
          className="flow-handle !border-primary !bg-background"
          isConnectable
        />
      </div>
    </div>
  );
}
