"use client";

import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";

export function StepsSidebar() {
  const steps = useBuilderStore((s) => s.steps);
  const activeStepId = useBuilderStore((s) => s.activeStepId);
  const setActiveStep = useBuilderStore((s) => s.setActiveStep);
  const addStep = useBuilderStore((s) => s.addStep);
  const deleteStep = useBuilderStore((s) => s.deleteStep);
  const updateStep = useBuilderStore((s) => s.updateStep);

  return (
    <aside className="flex w-48 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-3 py-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Etapas
        </p>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "group flex items-center gap-1 rounded-lg",
              activeStepId === step.id && "bg-muted",
            )}
          >
            <button
              type="button"
              onClick={() => setActiveStep(step.id)}
              className="min-w-0 flex-1 truncate px-2 py-2 text-left text-sm font-medium text-foreground"
            >
              {step.title}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Opções da etapa"
                  />
                }
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    const title = window.prompt("Nome da etapa", step.title);
                    if (title?.trim()) {
                      updateStep(step.id, { title: title.trim() });
                    }
                  }}
                >
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={steps.length <= 1}
                  onClick={() => deleteStep(step.id)}
                >
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-2">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2 text-sm"
          onClick={() => addStep()}
        >
          <Plus className="size-4" />
          Adicionar Etapa
        </Button>
      </div>
    </aside>
  );
}
