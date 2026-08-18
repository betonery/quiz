import type {
  InputWidgetConfig,
  OptionsWidgetConfig,
  QuizWidget,
} from "@/domains/quiz/types/builder.types";
import { parseOptionsAnswer } from "@/domains/quiz/utils/options-validation.utils";

function getOptionsVariableValue(
  config: OptionsWidgetConfig,
  raw: string | undefined,
): string | string[] {
  const value = parseOptionsAnswer(raw);
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
  const labels = selectedIds
    .map((id) => config.options.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  return config.multipleChoice ? labels : (labels[0] ?? "");
}

export function applyStepVariableBindings(params: {
  stepId: string;
  widgets: QuizWidget[];
  answers: Record<string, string>;
  currentVariables: Record<string, unknown>;
}): Record<string, unknown> {
  const { stepId, widgets, answers, currentVariables } = params;
  const next = { ...currentVariables };

  for (const widget of widgets) {
    if (widget.stepId !== stepId) continue;

    if (widget.type === "input") {
      const { variableKey } = widget.config as InputWidgetConfig;
      if (!variableKey) continue;
      next[variableKey] = answers[widget.id] ?? "";
      continue;
    }

    if (widget.type === "options") {
      const config = widget.config as OptionsWidgetConfig;
      if (!config.variableKey) continue;
      next[config.variableKey] = getOptionsVariableValue(
        config,
        answers[widget.id],
      );
    }
  }

  return next;
}
