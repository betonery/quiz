import type { OptionsWidgetConfig } from "@/domains/quiz/types/builder.types";

export function parseOptionsAnswer(raw: string | undefined): string | string[] {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
  } catch {
    // single value
  }
  return raw;
}

export function serializeOptionsAnswer(value: string | string[]): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  return value;
}

export function isOptionSelected(
  optionId: string,
  value: string | string[],
): boolean {
  if (Array.isArray(value)) return value.includes(optionId);
  return value === optionId;
}

export function toggleOptionSelection(
  optionId: string,
  value: string | string[],
  multiple: boolean,
): string | string[] {
  if (multiple) {
    const current = Array.isArray(value) ? value : value ? [value] : [];
    return current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
  }
  return optionId;
}

export function validateOptionsValue(
  config: OptionsWidgetConfig,
  value: string | string[],
): string | null {
  if (!config.required) return null;

  if (config.multipleChoice) {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    if (selected.length === 0) {
      return "Selecione pelo menos uma opção";
    }
    return null;
  }

  const selected = typeof value === "string" ? value : "";
  if (!selected) {
    return "Selecione uma opção";
  }
  return null;
}

export function validateStepOptions(
  widgets: { id: string; type: string; config: OptionsWidgetConfig }[],
  answers: Record<string, string>,
): Record<string, string | null> {
  const errors: Record<string, string | null> = {};

  for (const widget of widgets) {
    if (widget.type !== "options") continue;
    const raw = answers[widget.id];
    const value = parseOptionsAnswer(raw);
    errors[widget.id] = validateOptionsValue(widget.config, value);
  }

  return errors;
}

export function getSelectedOptionWithDestination(
  config: OptionsWidgetConfig,
  value: string | string[],
): string | null {
  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];

  for (const option of config.options) {
    if (selectedIds.includes(option.id) && option.destinationStepId) {
      return option.destinationStepId;
    }
  }
  return null;
}
