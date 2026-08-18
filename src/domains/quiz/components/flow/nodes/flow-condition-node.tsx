"use client";

import {
  Handle,
  Position,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { Copy, GitBranch, Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import {
  FlowNodeToolbar,
  FlowNodeToolbarButton,
} from "@/domains/quiz/components/flow/nodes/flow-node-toolbar";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  FLOW_CONDITION_ELSE_HANDLE,
  FLOW_FUNCTION_TARGET_HANDLE,
  FLOW_STEP_NODE_WIDTH,
  conditionHandleId,
} from "@/domains/quiz/types/flow.types";
import {
  formatConditionSummary,
  formatOperatorSymbol,
  operatorRequiresValue,
} from "@/domains/quiz/utils/condition-evaluation.utils";
import type { FlowConditionNodeData } from "@/domains/quiz/utils/flow-graph.utils";
import { cn } from "@/lib/utils";

const FLOW_HANDLE_CLASS = "flow-handle !border-primary !bg-[#0b121e]";

function FlowSourceHandle({ id }: { id: string }) {
  return (
    <Handle
      type="source"
      id={id}
      position={Position.Right}
      className={cn(FLOW_HANDLE_CLASS, "!top-1/2")}
      isConnectable
    />
  );
}

function ConditionBranchRow({
  branchIndex,
  summary,
  handleId,
  comparisons,
}: {
  branchIndex: number;
  summary: string;
  handleId: string;
  comparisons: FlowConditionNodeData["branches"][number]["comparisons"];
}) {
  const first = comparisons[0];

  return (
    <div className="relative -mr-3 w-[calc(100%+0.75rem)] pr-3 pl-1">
      <div className="flex w-full items-center gap-1 rounded-lg border border-slate-600/50 bg-[#111a2e] px-2 py-1.5">
        {first ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            <span className="shrink-0 text-[10px] font-medium text-slate-400">
              {formatOperatorSymbol(first.operator)}
            </span>
            {first.variableKey ? (
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {first.variableKey}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">variável</span>
            )}
            {operatorRequiresValue(first.operator) && (
              <>
                <span className="shrink-0 text-[10px] font-medium text-slate-400">
                  {formatOperatorSymbol(first.operator)}
                </span>
                <span className="truncate text-[10px] text-slate-300">
                  {first.value || "..."}
                </span>
              </>
            )}
            {comparisons.length > 1 && (
              <span
                className="truncate text-[9px] text-slate-500"
                title={summary}
              >
                +{comparisons.length - 1}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-500">
            Condição #{branchIndex + 1}
          </span>
        )}
      </div>
      <FlowSourceHandle id={handleId} />
    </div>
  );
}

export function FlowConditionNode({ id, data, selected }: NodeProps) {
  const nodeData = data as FlowConditionNodeData;
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
  }, [id, nodeData.label, nodeData.branches, updateNodeInternals]);

  return (
    <div
      className="group relative overflow-visible"
      style={{ width: FLOW_STEP_NODE_WIDTH }}
    >
      <FlowNodeToolbar visible={selected}>
        <FlowNodeToolbarButton
          label="Editar condições"
          onClick={() => openFlowFunctionEditor(nodeData.functionId)}
        >
          <Pencil className="size-3.5" />
        </FlowNodeToolbarButton>
        <FlowNodeToolbarButton
          label="Duplicar condições"
          onClick={() => duplicateFlowFunctionNode(nodeData.functionId)}
        >
          <Copy className="size-3.5" />
        </FlowNodeToolbarButton>
        <FlowNodeToolbarButton
          label="Excluir condições"
          variant="destructive"
          onClick={() => deleteFlowFunctionNode(nodeData.functionId)}
        >
          <Trash2 className="size-3.5" />
        </FlowNodeToolbarButton>
      </FlowNodeToolbar>

      <Handle
        type="target"
        id={FLOW_FUNCTION_TARGET_HANDLE}
        position={Position.Left}
        className={cn(FLOW_HANDLE_CLASS, "!top-1/2")}
        isConnectable
      />

      <div
        className={cn(
          "relative overflow-visible rounded-2xl border bg-[#0b121e] shadow-md transition-[border-color,box-shadow] duration-300",
          selected
            ? "border-primary/45 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            : "border-slate-600/60 group-hover:border-primary/30",
        )}
        style={{ width: FLOW_STEP_NODE_WIDTH }}
      >
        <div className="flex items-center gap-2 border-b border-slate-600/50 px-3 py-2">
          <GitBranch className="size-3.5 shrink-0 text-slate-400" />
          <p className="truncate text-xs font-medium text-slate-100">
            {nodeData.label}
          </p>
        </div>

        <div className="space-y-1.5 p-2.5">
          {nodeData.branches.length === 0 ? (
            <p className="px-1 py-2 text-center text-[10px] text-slate-500">
              Nenhuma condição adicionada
            </p>
          ) : (
            nodeData.branches.map((branch, index) => (
              <ConditionBranchRow
                key={branch.id}
                branchIndex={index}
                summary={formatConditionSummary(branch)}
                handleId={conditionHandleId(branch.id)}
                comparisons={branch.comparisons}
              />
            ))
          )}

          <div className="relative -mr-3 w-[calc(100%+0.75rem)] pr-3 pl-1">
            <div className="flex w-full items-center rounded-lg border border-slate-600/50 bg-[#111a2e] px-2 py-1.5">
              <span className="text-[10px] font-medium text-slate-400">
                Se não
              </span>
            </div>
            <FlowSourceHandle id={FLOW_CONDITION_ELSE_HANDLE} />
          </div>
        </div>
      </div>
    </div>
  );
}
