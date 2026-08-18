"use client";

import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { BuilderCanvas } from "@/domains/quiz/components/builder/builder-canvas";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";

export function DesignPreviewPanel() {
  const steps = useBuilderStore((s) => s.steps);
  const activeStepId = useBuilderStore((s) => s.activeStepId);
  const setActiveStep = useBuilderStore((s) => s.setActiveStep);

  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
  const activeIndex = sortedSteps.findIndex((step) => step.id === activeStepId);
  const activeStep = sortedSteps[activeIndex];

  function goToStep(offset: number) {
    const nextIndex = activeIndex + offset;
    if (nextIndex < 0 || nextIndex >= sortedSteps.length) return;
    setActiveStep(sortedSteps[nextIndex].id);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#080d18]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(51 65 85 / 0.35) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-slate-700/60 bg-[#0b121e]/80 px-5 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-800/80">
            <Eye className="size-4 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Pré-visualização
            </h2>
            <p className="text-xs text-slate-400">
              Alterações globais aplicadas em tempo real
            </p>
          </div>
        </div>

        {sortedSteps.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToStep(-1)}
              disabled={activeIndex <= 0}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Etapa anterior"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex max-w-[min(480px,50vw)] items-center gap-1.5 overflow-x-auto rounded-xl border border-slate-700/60 bg-slate-900/50 p-1">
              {sortedSteps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    step.id === activeStepId
                      ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-200",
                  )}
                >
                  {step.title.trim() || `Etapa ${index + 1}`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToStep(1)}
              disabled={activeIndex >= sortedSteps.length - 1}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima etapa"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-6">
          {sortedSteps.length === 0 ? (
            <p className="text-sm text-slate-400">
              Adicione etapas no fluxo para visualizar o funil.
            </p>
          ) : (
            <>
              {activeStep ? (
                <p className="mb-4 text-xs text-slate-500">
                  {activeIndex + 1} de {sortedSteps.length} —{" "}
                  {activeStep.title.trim() || `Etapa ${activeIndex + 1}`}
                </p>
              ) : null}
              <div className="w-full max-w-[420px]">
                <BuilderCanvas variant="full" mode="preview" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
