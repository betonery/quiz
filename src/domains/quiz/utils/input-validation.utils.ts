import type { InputWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  INPUT_NUMBER_MAX_LENGTH,
  INPUT_PHONE_DIGITS,
  INPUT_TEXT_MAX_LENGTH,
} from "@/domains/quiz/utils/input-phone-mask.utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInputValue(
  config: InputWidgetConfig,
  value: string,
): string | null {
  const trimmed = value.trim();

  if (config.required && !trimmed) {
    return "Este campo é obrigatório";
  }

  if (!trimmed) {
    return null;
  }

  switch (config.inputType) {
    case "email":
      if (!EMAIL_REGEX.test(trimmed)) {
        return "Informe um e-mail válido";
      }
      break;
    case "phone":
      if (trimmed.length < INPUT_PHONE_DIGITS) {
        return "Informe um telefone válido";
      }
      break;
    case "text":
      if (trimmed.length > INPUT_TEXT_MAX_LENGTH) {
        return `Máximo de ${INPUT_TEXT_MAX_LENGTH} caracteres`;
      }
      break;
    case "number":
      if (!/^\d+$/.test(trimmed)) {
        return "Informe apenas números";
      }
      if (trimmed.length > INPUT_NUMBER_MAX_LENGTH) {
        return `Máximo de ${INPUT_NUMBER_MAX_LENGTH} dígitos`;
      }
      break;
    case "password":
      break;
  }

  return null;
}

export function validateStepInputs(
  widgets: { id: string; type: string; config: InputWidgetConfig }[],
  answers: Record<string, string>,
): Record<string, string | null> {
  const errors: Record<string, string | null> = {};

  for (const widget of widgets) {
    if (widget.type !== "input") continue;
    const value = answers[widget.id] ?? "";
    errors[widget.id] = validateInputValue(widget.config, value);
  }

  return errors;
}
