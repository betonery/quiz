import type { OptionsWidgetConfig } from "@/domains/quiz/types/builder.types";
import { optionHandleId } from "@/domains/quiz/types/flow.types";
import { parseOptionsAnswer } from "@/domains/quiz/utils/options-validation.utils";

type StepOptionsWidget = {
  id: string;
  config: OptionsWidgetConfig;
};

/**
 * When a step uses single-choice options without auto-advance, the button
 * follows the selected option's flow handle. Multiple-choice steps always
 * route through the button handle instead.
 */
export function findSingleChoiceOptionNavigationHandle(
  optionsWidgets: StepOptionsWidget[],
  answers: Record<string, string>,
): string | null {
  for (const widget of optionsWidgets) {
    if (widget.config.multipleChoice) continue;

    const raw = answers[widget.id];
    const value = parseOptionsAnswer(raw);
    const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
    const selectedOption = widget.config.options.find((option) =>
      selectedIds.includes(option.id),
    );

    if (selectedOption) {
      return optionHandleId(widget.id, selectedOption.id);
    }
  }

  return null;
}
