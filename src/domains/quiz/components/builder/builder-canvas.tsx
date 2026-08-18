"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft } from "lucide-react";
import { QuizDesignProvider } from "@/domains/quiz/components/design/quiz-design-provider";
import { QuizHeaderLogo } from "@/domains/quiz/components/design/quiz-header-logo";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { QuizWidget } from "@/domains/quiz/types/builder.types";
import { WidgetToolbar } from "@/domains/quiz/components/builder/widget-toolbar";
import { WidgetLayout } from "@/domains/quiz/components/widget/widget-layout";
import { WidgetRendererByType } from "@/domains/quiz/components/widget/widget-renderer-by-type";
import {
  QUIZ_STEP_PROGRESS_CLASS,
  QUIZ_STEP_WIDGETS_CLASS,
  QUIZ_WIDGET_STACK_CLASS,
} from "@/domains/quiz/components/builder/builder-layout";
import { cn } from "@/lib/utils";

function DropZone({ stepId, index }: { stepId: string; index: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop::${stepId}::${index}`,
    data: { stepId, index, type: "drop-zone" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-1 shrink-0 rounded-md border border-dashed border-transparent transition-all",
        isOver && "h-6 border-primary bg-primary/10",
      )}
    />
  );
}

function EmptyStepDropArea({
  stepId,
  mode,
}: {
  stepId: string;
  mode: "edit" | "preview";
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop::${stepId}::0`,
    data: { stepId, index: 0, type: "drop-zone" },
    disabled: mode === "preview",
  });

  if (mode === "preview") {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
        <p>Esta etapa está vazia</p>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center text-sm transition-colors",
        isOver
          ? "border-primary bg-primary/10 text-foreground"
          : "border-neutral-300 text-neutral-500",
      )}
    >
      <p>Nada por aqui</p>
      <p className="mt-1">Arraste um componente para começar.</p>
    </div>
  );
}

function PreviewWidgetItem({ widget }: { widget: QuizWidget }) {
  const design = useBuilderStore((s) => s.design);

  return (
    <WidgetLayout layout={widget.config}>
      <WidgetRendererByType
        widget={widget}
        design={design}
        mode="preview"
        readOnly
      />
    </WidgetLayout>
  );
}

function SortableWidgetItem({ widget }: { widget: QuizWidget }) {
  const selectedWidgetId = useBuilderStore((s) => s.selectedWidgetId);
  const design = useBuilderStore((s) => s.design);
  const selectWidget = useBuilderStore((s) => s.selectWidget);
  const duplicateWidget = useBuilderStore((s) => s.duplicateWidget);
  const deleteWidget = useBuilderStore((s) => s.deleteWidget);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `widget::${widget.id}`,
    data: { widgetId: widget.id, stepId: widget.stepId, type: "widget" },
  });

  const isSelected = selectedWidgetId === widget.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("relative", isDragging && "opacity-50")}
    >
      {isSelected && (
        <WidgetToolbar
          onDuplicate={() => duplicateWidget(widget.id)}
          onDelete={() => deleteWidget(widget.id)}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => selectWidget(widget.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectWidget(widget.id);
          }
        }}
        className={cn(
          "w-full cursor-pointer rounded-lg text-left transition-colors",
          isSelected
            ? "ring-2 ring-primary ring-offset-2 ring-offset-white"
            : "hover:bg-muted/50",
        )}
      >
        <WidgetLayout layout={widget.config}>
          <WidgetRendererByType
            widget={widget}
            design={design}
            mode="edit"
            readOnly
            highlightVariables
          />
        </WidgetLayout>
      </div>
    </div>
  );
}

export function BuilderCanvas({
  variant = "full",
  mode = "edit",
}: {
  variant?: "full" | "drawer";
  mode?: "edit" | "preview";
}) {
  const steps = useBuilderStore((s) => s.steps);
  const widgets = useBuilderStore((s) => s.widgets);
  const design = useBuilderStore((s) => s.design);
  const activeStepId = useBuilderStore((s) => s.activeStepId);
  const selectWidget = useBuilderStore((s) => s.selectWidget);

  const activeStep = steps.find((s) => s.id === activeStepId);
  const stepWidgets = widgets
    .filter((w) => w.stepId === activeStepId)
    .sort((a, b) => a.position - b.position);

  const stepIndex = steps.findIndex((s) => s.id === activeStepId);
  const progress =
    steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 0;

  const isPreview = mode === "preview";

  if (!activeStep) {
    return (
      <div
        className={cn(
          "flex flex-1 items-center justify-center",
          variant === "drawer" ? "p-0" : isPreview ? "p-0" : "bg-muted/30 p-6",
        )}
      >
        <p className={isPreview ? "text-slate-400" : "text-muted-foreground"}>
          Selecione uma etapa
        </p>
      </div>
    );
  }

  const widgetList = (
    <>
      {stepWidgets.length === 0 ? (
        <div className={QUIZ_STEP_WIDGETS_CLASS}>
          <EmptyStepDropArea stepId={activeStep.id} mode={mode} />
        </div>
      ) : isPreview ? (
        <div className={QUIZ_STEP_WIDGETS_CLASS}>
          <div className={QUIZ_WIDGET_STACK_CLASS}>
            {stepWidgets.map((widget) => (
              <PreviewWidgetItem key={widget.id} widget={widget} />
            ))}
          </div>
        </div>
      ) : (
        <div className={QUIZ_STEP_WIDGETS_CLASS}>
          <DropZone stepId={activeStep.id} index={0} />
          <div className={QUIZ_WIDGET_STACK_CLASS}>
            {stepWidgets.map((widget, index) => (
              <div key={widget.id}>
                <SortableWidgetItem widget={widget} />
                <DropZone stepId={activeStep.id} index={index + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "flex w-full",
        variant === "drawer"
          ? "h-full min-h-0 flex-1 overflow-hidden"
          : isPreview
            ? "items-start justify-center p-0"
            : "flex-1 items-start justify-center overflow-y-auto bg-muted/30 p-6",
      )}
      onClick={isPreview ? undefined : () => selectWidget(null)}
    >
      <div
        className={cn(
          "shrink-0 bg-white shadow-inner",
          variant === "drawer"
            ? "h-full w-full overflow-hidden rounded-[1.25rem]"
            : isPreview
              ? "w-full max-w-[390px] overflow-hidden rounded-[1.75rem] border border-slate-700/50 shadow-xl shadow-black/20"
              : "w-full max-w-[390px] overflow-hidden rounded-2xl border border-border shadow-lg",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <QuizDesignProvider
          design={design}
          className={cn(
            variant === "drawer"
              ? "flex h-full min-h-0 flex-col"
              : isPreview
                ? "flex flex-col overflow-hidden rounded-[1.75rem]"
                : "min-h-[480px]",
          )}
        >
          {activeStep.settings.showLogo || activeStep.settings.allowBack ? (
            <div className="flex items-center justify-between px-4 pt-4">
              {activeStep.settings.allowBack ? (
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full"
                  style={{ color: design.colors.titles }}
                  aria-label="Voltar"
                >
                  <ArrowLeft className="size-4" />
                </button>
              ) : (
                <span className="size-8" />
              )}
              {activeStep.settings.showLogo ? (
                <QuizHeaderLogo header={design.header} />
              ) : (
                <span className="size-10" />
              )}
              <span className="size-8" />
            </div>
          ) : null}

          {activeStep.settings.showProgress && (
            <div className={cn("mx-4", QUIZ_STEP_PROGRESS_CLASS)}>
              <div
                className="h-full rounded-sm transition-all"
                style={{
                  width: `${progress}%`,
                  backgroundColor: design.colors.primary,
                }}
              />
            </div>
          )}

          <div
            className={cn(
              "px-4 pb-4",
              variant === "drawer"
                ? "min-h-0 flex-1 overflow-y-auto"
                : isPreview
                  ? "pt-2"
                  : "min-h-[480px] flex-1 overflow-y-auto",
            )}
          >
            {isPreview ? (
              widgetList
            ) : (
              <SortableContext
                items={stepWidgets.map((w) => `widget::${w.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {widgetList}
              </SortableContext>
            )}
          </div>
        </QuizDesignProvider>
      </div>
    </div>
  );
}
