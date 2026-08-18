"use client";

import { ArrowLeft } from "lucide-react";
import type {
  OptionItem,
  OptionsWidgetConfig,
  QuizStep,
  QuizWidget,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  QUIZ_STEP_PROGRESS_CLASS,
  QUIZ_STEP_WIDGETS_CLASS,
  QUIZ_WIDGET_STACK_CLASS,
} from "@/domains/quiz/components/builder/builder-layout";
import { QuizHeaderLogo } from "@/domains/quiz/components/design/quiz-header-logo";
import { WidgetLayout } from "@/domains/quiz/components/widget/widget-layout";
import { WidgetRendererByType } from "@/domains/quiz/components/widget/widget-renderer-by-type";
import { cn } from "@/lib/utils";

type QuizStepScreenProps = {
  step: QuizStep;
  widgets: QuizWidget[];
  design: QuizDesignSettings;
  stepIndex: number;
  totalSteps: number;
  answers: Record<string, string>;
  errors: Record<string, string | null>;
  variables?: Record<string, unknown>;
  onAnswerChange: (widgetId: string, value: string) => void;
  onOptionsChange: (widgetId: string, value: string | string[]) => void;
  onOptionSelect: (
    widgetId: string,
    option: OptionItem,
    config: OptionsWidgetConfig,
  ) => void;
  onBack?: () => void;
  onButtonClick?: (widgetId: string) => void;
  onRedirectTrigger?: (widgetId: string) => void;
  onCountdownExpire?: (widgetId: string) => void;
  quizSlug?: string;
  canGoBack?: boolean;
};

export function QuizStepScreen({
  step,
  widgets,
  design,
  stepIndex,
  totalSteps,
  answers,
  errors,
  variables,
  onAnswerChange,
  onOptionsChange,
  onOptionSelect,
  onBack,
  onButtonClick,
  onRedirectTrigger,
  onCountdownExpire,
  quizSlug,
  canGoBack = false,
}: QuizStepScreenProps) {
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;
  // A primeira etapa é renderizada acima da dobra no carregamento inicial:
  // suas imagens devem priorizar o LCP (eager + fetchPriority high).
  const isFirstStep = stepIndex === 0;
  const stepWidgets = widgets
    .filter((w) => w.stepId === step.id)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="w-full">
      {step.settings.showLogo || step.settings.allowBack ? (
        <div className="flex items-center justify-between">
          {step.settings.allowBack && canGoBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: design.colors.titles }}
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <span className="size-8" />
          )}
          {step.settings.showLogo ? (
            <QuizHeaderLogo header={design.header} />
          ) : (
            <span className="size-10" />
          )}
          <span className="size-8" />
        </div>
      ) : null}

      {step.settings.showProgress && (
        <div className={QUIZ_STEP_PROGRESS_CLASS}>
          <div
            className="h-full rounded-sm transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: design.colors.primary,
            }}
          />
        </div>
      )}

      <div className={cn(QUIZ_STEP_WIDGETS_CLASS, QUIZ_WIDGET_STACK_CLASS)}>
        {stepWidgets.length === 0 ? (
          <p
            className="py-12 text-center text-sm"
            style={{ color: design.colors.texts }}
          >
            Esta etapa ainda não possui conteúdo.
          </p>
        ) : (
          stepWidgets.map((widget) =>
            widget.type === "redirect" || widget.type === "script" ? (
              <WidgetRendererByType
                key={widget.id}
                widget={widget}
                design={design}
                mode="player"
                variables={variables}
                answers={answers}
                errors={errors}
                onAnswerChange={onAnswerChange}
                onOptionsChange={onOptionsChange}
                onOptionSelect={onOptionSelect}
                onRedirectTrigger={onRedirectTrigger}
              />
            ) : (
              <WidgetLayout key={widget.id} layout={widget.config}>
                <WidgetRendererByType
                  widget={widget}
                  design={design}
                  mode="player"
                  variables={variables}
                  answers={answers}
                  errors={errors}
                  onAnswerChange={onAnswerChange}
                  onOptionsChange={onOptionsChange}
                  onOptionSelect={onOptionSelect}
                  onButtonClick={onButtonClick}
                  onCountdownExpire={onCountdownExpire}
                  quizSlug={quizSlug}
                  priority={isFirstStep}
                />
              </WidgetLayout>
            ),
          )
        )}
      </div>
    </div>
  );
}
