"use client";

import { ChevronDown, FilePlus, FunctionSquare, Variable } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuizVariablesManager } from "@/domains/quiz/components/variables/quiz-variables-manager";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { FlowFunctionType } from "@/domains/quiz/types/flow.types";
import { cn } from "@/lib/utils";

const FLOW_ACTION_WIDTH = "w-[12.5rem]";

const flowActionButtonClass = cn(
  "pointer-events-auto inline-flex h-10 items-center justify-start gap-2.5",
  FLOW_ACTION_WIDTH,
  "rounded-xl border border-slate-700/70 bg-[#0c1220]/95 px-3",
  "text-sm font-medium text-slate-100 shadow-sm backdrop-blur-sm",
  "transition-[border-color,background-color,box-shadow] duration-200",
  "hover:border-slate-600 hover:bg-slate-800/90",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

const flowActionIconClass =
  "flex size-7 shrink-0 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/70 text-slate-300";

type FlowActionButtonProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  trailing?: ReactNode;
};

function FlowActionButton({
  icon,
  label,
  onClick,
  active = false,
  trailing,
}: FlowActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        flowActionButtonClass,
        active && "border-primary/50 bg-primary/10 text-primary",
        active &&
          "[&_[data-flow-action-icon]]:border-primary/40 [&_[data-flow-action-icon]]:bg-primary/15 [&_[data-flow-action-icon]]:text-primary",
      )}
    >
      <span data-flow-action-icon className={flowActionIconClass}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {trailing}
    </button>
  );
}

export function FlowFloatingActions() {
  const addStep = useBuilderStore((s) => s.addStep);
  const addFlowFunctionNode = useBuilderStore((s) => s.addFlowFunctionNode);
  const [showVariables, setShowVariables] = useState(false);

  function handleCreateFunction(type: FlowFunctionType) {
    addFlowFunctionNode(type);
    setShowVariables(false);
  }

  return (
    <div className="pointer-events-none absolute top-4 left-4 z-10 flex items-start gap-3">
      <div className="pointer-events-auto flex flex-col gap-1.5">
        <FlowActionButton
          icon={<FilePlus className="size-3.5" />}
          label="Criar Página"
          onClick={() => addStep({ centerInFlow: true })}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(flowActionButtonClass, "group")}
            onClick={() => setShowVariables(false)}
          >
            <span data-flow-action-icon className={flowActionIconClass}>
              <FunctionSquare className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-left">
              Criar Função
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-slate-500 transition-transform group-data-popup-open:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={10}
            className="w-52 border-slate-700/70 bg-[#0c1220] text-slate-100 ring-slate-700/40"
          >
            <DropdownMenuItem
              className="focus:bg-slate-800/80"
              onClick={() => handleCreateFunction("link")}
            >
              Link
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-slate-800/80"
              onClick={() => handleCreateFunction("condition")}
            >
              Condição
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-slate-800/80"
              onClick={() => handleCreateFunction("webhook")}
            >
              Webhook
            </DropdownMenuItem>
            <DropdownMenuItem
              className="focus:bg-slate-800/80"
              onClick={() => handleCreateFunction("set_variable")}
            >
              Variável
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <FlowActionButton
          icon={<Variable className="size-3.5" />}
          label="Variáveis"
          active={showVariables}
          onClick={() => setShowVariables((current) => !current)}
        />
      </div>

      {showVariables && (
        <div className="pointer-events-auto w-80 max-h-[min(420px,calc(100vh-8rem))] overflow-y-auto rounded-2xl border border-slate-700/60 bg-[#0b121e]/95 p-3 shadow-xl backdrop-blur-md">
          <QuizVariablesManager />
        </div>
      )}
    </div>
  );
}
