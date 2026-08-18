"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  InputWidgetConfig,
  OptionItem,
  OptionsWidgetConfig,
  QuizStep,
  QuizWidget,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type {
  FlowFunctionNode,
  FlowLayout,
} from "@/domains/quiz/types/flow.types";
import {
  buttonHandleId,
  defaultFlowLayout,
  optionHandleId,
  redirectHandleId,
  countdownHandleId,
} from "@/domains/quiz/types/flow.types";
import type { QuizSettings } from "@/domains/quiz/types/quiz-settings.types";
import { defaultQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";
import { QuizDesignProvider } from "@/domains/quiz/components/design/quiz-design-provider";
import { QuizStepScreen } from "@/domains/quiz/components/player/quiz-step-screen";
import {
  QuizTrackingScripts,
  trackMetaLeadEvent,
} from "@/domains/quiz/components/player/quiz-tracking-scripts";
import {
  trackQuizCompletion,
  useQuizAnalytics,
} from "@/domains/quiz/hooks/use-quiz-analytics";
import { appendCurrentSearchParams } from "@/domains/quiz/utils/link-redirect.utils";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveNavigationPath } from "@/domains/quiz/utils/flow-navigation.utils";
import { validateStepInputs } from "@/domains/quiz/utils/input-validation.utils";
import {
  serializeOptionsAnswer,
  validateStepOptions,
} from "@/domains/quiz/utils/options-validation.utils";
import { getStepTransitionVariants } from "@/domains/quiz/utils/step-transition.utils";
import { evaluateVariableExpression } from "@/domains/quiz/utils/variable-expression.utils";
import { applyStepVariableBindings } from "@/domains/quiz/utils/player-widget-variables.utils";
import { findSingleChoiceOptionNavigationHandle } from "@/domains/quiz/utils/player-button-navigation.utils";
import {
  popPlayerSnapshot,
  pushPlayerSnapshot,
  type PlayerNavigationSnapshot,
} from "@/domains/quiz/utils/player-navigation.utils";

type QuizPlayerProps = {
  steps: QuizStep[];
  widgets: QuizWidget[];
  design?: QuizDesignSettings;
  flowLayout?: FlowLayout;
  quizSlug?: string;
  settings?: QuizSettings;
  trackingEnabled?: boolean;
  recordAnalytics?: boolean;
};

function dispatchWebhooksInBackground(
  quizSlug: string,
  functionNodes: FlowFunctionNode[],
  variables: Record<string, unknown>,
) {
  for (const fn of functionNodes) {
    if (fn.type !== "webhook") continue;
    void fetch(`/api/q/${encodeURIComponent(quizSlug)}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ functionId: fn.id, variables }),
    }).catch(() => {});
  }
}

function applyFlowFunctions(
  currentVariables: Record<string, unknown>,
  functionNodes: FlowFunctionNode[],
): Record<string, unknown> {
  const next = { ...currentVariables };
  for (const fn of functionNodes) {
    if (
      fn.type === "set_variable" &&
      fn.config &&
      "variableKey" in fn.config &&
      fn.config.variableKey
    ) {
      next[fn.config.variableKey] = evaluateVariableExpression(
        fn.config.expression ?? "",
        next,
      );
    }
  }
  return next;
}

export function QuizPlayer({
  steps,
  widgets,
  design = defaultQuizDesignSettings,
  flowLayout = defaultFlowLayout,
  quizSlug,
  settings = defaultQuizSettings,
  trackingEnabled = false,
  recordAnalytics = false,
}: QuizPlayerProps) {
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<
    PlayerNavigationSnapshot[]
  >([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [variables, setVariables] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const activeStep = sortedSteps[activeStepIndex];

  useQuizAnalytics({
    quizSlug,
    enabled: recordAnalytics,
    activeStepId: activeStep?.id,
  });

  const isInitialStepMount = useRef(true);
  useEffect(() => {
    if (isInitialStepMount.current) {
      isInitialStepMount.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [activeStepIndex]);

  const getStepInputWidgets = useCallback(
    (stepId: string) =>
      widgets
        .filter((w) => w.stepId === stepId && w.type === "input")
        .map((w) => ({
          id: w.id,
          type: w.type,
          config: w.config as InputWidgetConfig,
        })),
    [widgets],
  );

  const getStepOptionsWidgets = useCallback(
    (stepId: string) =>
      widgets
        .filter((w) => w.stepId === stepId && w.type === "options")
        .map((w) => ({
          id: w.id,
          type: w.type,
          config: w.config as OptionsWidgetConfig,
        })),
    [widgets],
  );

  const validateStepInputsOnly = useCallback(
    (stepId: string): boolean => {
      const inputWidgets = getStepInputWidgets(stepId);
      const stepErrors = validateStepInputs(inputWidgets, answers);
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return !Object.values(stepErrors).some(Boolean);
    },
    [answers, getStepInputWidgets],
  );

  const validateCurrentStep = useCallback((): boolean => {
    if (!activeStep) return true;

    const inputWidgets = getStepInputWidgets(activeStep.id);
    const optionsWidgets = getStepOptionsWidgets(activeStep.id);

    const inputErrors = validateStepInputs(inputWidgets, answers);
    const optionsErrors = validateStepOptions(optionsWidgets, answers);
    const merged = { ...inputErrors, ...optionsErrors };

    setErrors((prev) => ({ ...prev, ...merged }));
    return !Object.values(merged).some(Boolean);
  }, [activeStep, answers, getStepInputWidgets, getStepOptionsWidgets]);

  function goToStepIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= sortedSteps.length) return;
    if (nextIndex === activeStepIndex) return;

    setActiveStepIndex(nextIndex);
    setErrors({});
  }

  function navigateToStep(stepId: string | null | "next") {
    if (stepId === null) return;

    if (stepId === "next") {
      if (activeStepIndex < sortedSteps.length - 1) {
        goToStepIndex(activeStepIndex + 1);
      }
      return;
    }

    const idx = sortedSteps.findIndex((s) => s.id === stepId);
    if (idx >= 0) {
      goToStepIndex(idx);
    }
  }

  const navigateWithFlow = (
    sourceStepId: string,
    sourceHandle: string,
    snapshotOverrides?: {
      answers?: Record<string, string>;
      variables?: Record<string, unknown>;
    },
  ) => {
    const snapshotAnswers = snapshotOverrides?.answers ?? answers;
    const snapshotVariables = snapshotOverrides?.variables ?? variables;

    const boundVariables = applyStepVariableBindings({
      stepId: sourceStepId,
      widgets,
      answers: snapshotAnswers,
      currentVariables: snapshotVariables,
    });

    const {
      targetStepId,
      functionNodes,
      redirectUrl,
      redirectOpenInNewWindow,
    } = resolveNavigationPath({
      sourceStepId,
      sourceHandle,
      widgets,
      flowLayout,
      variables: boundVariables,
    });

    if (!targetStepId && !redirectUrl) return;

    setNavigationHistory((prev) =>
      pushPlayerSnapshot(prev, {
        stepIndex: activeStepIndex,
        variables: snapshotVariables,
        answers: snapshotAnswers,
      }),
    );

    if (functionNodes.length > 0) {
      const nextVariables = applyFlowFunctions(boundVariables, functionNodes);
      setVariables(nextVariables);

      if (quizSlug) {
        dispatchWebhooksInBackground(quizSlug, functionNodes, nextVariables);
      }
    } else {
      setVariables(boundVariables);
    }

    if (redirectUrl) {
      trackMetaLeadEvent();
      trackQuizCompletion(quizSlug, recordAnalytics);
      const finalUrl = appendCurrentSearchParams(redirectUrl);
      if (redirectOpenInNewWindow) {
        window.open(finalUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.assign(finalUrl);
      }
      return;
    }

    if (
      !targetStepId &&
      activeStepIndex === sortedSteps.length - 1 &&
      functionNodes.length === 0
    ) {
      trackMetaLeadEvent();
      trackQuizCompletion(quizSlug, recordAnalytics);
    }

    if (targetStepId) {
      navigateToStep(targetStepId);
    }
  };

  function handleAnswerChange(widgetId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [widgetId]: value }));
    setErrors((prev) => ({ ...prev, [widgetId]: null }));
  }

  function handleOptionsChange(widgetId: string, value: string | string[]) {
    setAnswers((prev) => ({
      ...prev,
      [widgetId]: serializeOptionsAnswer(value),
    }));
    setErrors((prev) => ({ ...prev, [widgetId]: null }));
  }

  function handleOptionSelect(
    widgetId: string,
    option: OptionItem,
    config: OptionsWidgetConfig,
  ) {
    if (
      option.validateFields &&
      activeStep &&
      !validateStepInputsOnly(activeStep.id)
    ) {
      return;
    }

    if (config.autoAdvance && !config.multipleChoice && activeStep) {
      const serializedAnswer = serializeOptionsAnswer(option.id);
      navigateWithFlow(activeStep.id, optionHandleId(widgetId, option.id), {
        answers: {
          ...answers,
          [widgetId]: serializedAnswer,
        },
      });
    }
  }

  if (!activeStep) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p style={{ color: design.colors.texts }}>
          Este funil não possui etapas.
        </p>
      </div>
    );
  }

  function handleButtonClick(widgetId: string) {
    if (!validateCurrentStep() || !activeStep) return;

    const optionHandle = findSingleChoiceOptionNavigationHandle(
      getStepOptionsWidgets(activeStep.id),
      answers,
    );
    if (optionHandle) {
      navigateWithFlow(activeStep.id, optionHandle);
      return;
    }

    navigateWithFlow(activeStep.id, buttonHandleId(widgetId));
  }

  function handleRedirectTrigger(widgetId: string) {
    if (!validateCurrentStep() || !activeStep) return;

    const optionHandle = findSingleChoiceOptionNavigationHandle(
      getStepOptionsWidgets(activeStep.id),
      answers,
    );
    if (optionHandle) {
      navigateWithFlow(activeStep.id, optionHandle);
      return;
    }

    navigateWithFlow(activeStep.id, redirectHandleId(widgetId));
  }

  function handleCountdownExpire(widgetId: string) {
    if (!activeStep) return;

    navigateWithFlow(activeStep.id, countdownHandleId(widgetId));
  }

  function handleBack() {
    const { history, snapshot } = popPlayerSnapshot(navigationHistory);
    if (!snapshot) return;

    setNavigationHistory(history);
    setActiveStepIndex(snapshot.stepIndex);
    setVariables(snapshot.variables);
    setAnswers(snapshot.answers);
    setErrors({});
  }

  const variants = getStepTransitionVariants(design.animation.stepTransition);
  const transition =
    design.animation.stepTransition === "none"
      ? { duration: 0 }
      : {
          delay: design.animation.delay,
          duration: design.animation.duration,
        };

  return (
    <>
      <QuizTrackingScripts settings={settings} enabled={trackingEnabled} />
      <QuizDesignProvider
        design={design}
        className="flex min-h-screen flex-col items-center px-4 py-10 sm:py-16"
      >
        <div className="w-full max-w-[390px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={transition}
            >
              <QuizStepScreen
                step={activeStep}
                widgets={widgets}
                design={design}
                stepIndex={activeStepIndex}
                totalSteps={sortedSteps.length}
                answers={answers}
                errors={errors}
                variables={variables}
                onAnswerChange={handleAnswerChange}
                onOptionsChange={handleOptionsChange}
                onOptionSelect={handleOptionSelect}
                onBack={handleBack}
                onButtonClick={handleButtonClick}
                onRedirectTrigger={handleRedirectTrigger}
                onCountdownExpire={handleCountdownExpire}
                quizSlug={quizSlug}
                canGoBack={navigationHistory.length > 0}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </QuizDesignProvider>
    </>
  );
}
