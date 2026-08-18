"use client";

import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { Copy, Link as LinkIcon, Pencil, Trash2, Webhook } from "lucide-react";
import { useEffect } from "react";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  FlowNodeToolbar,
  FlowNodeToolbarButton,
} from "@/domains/quiz/components/flow/nodes/flow-node-toolbar";
import {
  FLOW_FUNCTION_SOURCE_HANDLE,
  FLOW_FUNCTION_TARGET_HANDLE,
} from "@/domains/quiz/types/flow.types";
import type { FlowFunctionNodeData } from "@/domains/quiz/utils/flow-graph.utils";
import { cn } from "@/lib/utils";

export function FlowFunctionNode({ id, data, selected }: NodeProps) {
  const nodeData = data as FlowFunctionNodeData;
  const updateNodeInternals = useUpdateNodeInternals();
  const deleteFlowFunctionNode = useBuilderStore(
    (s) => s.deleteFlowFunctionNode,
  );
  const duplicateFlowFunctionNode = useBuilderStore(
    (s) => s.duplicateFlowFunctionNode,
  );
  const openFlowFunctionEditor = useBuilderStore(
    (s) => s.openFlowFunctionEditor,
  );

  useEffect(() => {
    updateNodeInternals(id);
  }, [
    id,
    nodeData.label,
    nodeData.type,
    nodeData.linkUrl,
    nodeData.linkHasVariables,
    updateNodeInternals,
  ]);

  return (
    <div className="group relative overflow-visible">
      <FlowNodeToolbar visible={selected}>
        <FlowNodeToolbarButton
          label="Editar função"
          onClick={() => {
            if (
              nodeData.type === "set_variable" ||
              nodeData.type === "link" ||
              nodeData.type === "webhook"
            ) {
              openFlowFunctionEditor(nodeData.functionId);
            }
          }}
        >
          <Pencil className="size-3.5" />
        </FlowNodeToolbarButton>
        <FlowNodeToolbarButton
          label="Duplicar função"
          onClick={() => duplicateFlowFunctionNode(nodeData.functionId)}
        >
          <Copy className="size-3.5" />
        </FlowNodeToolbarButton>
        <FlowNodeToolbarButton
          label="Excluir função"
          variant="destructive"
          onClick={() => deleteFlowFunctionNode(nodeData.functionId)}
        >
          <Trash2 className="size-3.5" />
        </FlowNodeToolbarButton>
      </FlowNodeToolbar>

      <div
        className={cn(
          "flex items-center justify-center border px-4 text-sm font-medium shadow-sm",
          nodeData.type === "link"
            ? "min-w-[200px] flex-col gap-1 rounded-xl py-2.5"
            : "min-w-[140px] rounded-full py-2.5",
          selected
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-foreground",
        )}
      >
        <Handle
          type="target"
          id={FLOW_FUNCTION_TARGET_HANDLE}
          position={Position.Left}
          className="flow-handle !border-primary !bg-background"
          isConnectable
        />
        <span className="flex max-w-full items-center gap-1.5">
          {nodeData.type === "link" ? (
            <LinkIcon className="size-3.5 shrink-0 opacity-70" />
          ) : nodeData.type === "webhook" ? (
            <Webhook className="size-3.5 shrink-0 opacity-70" />
          ) : null}
          <span className="truncate">{nodeData.label}</span>
          {nodeData.type === "link" && nodeData.linkHasVariables ? (
            <span
              className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700"
              title="URL com parâmetros dinâmicos"
            >
              {"{{…}}"}
            </span>
          ) : null}
        </span>
        {nodeData.type === "link" && nodeData.linkUrl ? (
          <span
            className="max-w-[220px] truncate text-[10px] font-normal opacity-60"
            title={nodeData.linkUrl}
          >
            {nodeData.linkUrl}
          </span>
        ) : null}
        {nodeData.type !== "link" && (
          <Handle
            type="source"
            id={FLOW_FUNCTION_SOURCE_HANDLE}
            position={Position.Right}
            className="flow-handle !border-primary !bg-background"
            isConnectable
          />
        )}
      </div>
    </div>
  );
}
