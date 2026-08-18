import type {
  InputSize,
  InputWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";

export const INPUT_DEFAULT_BORDER_COLOR = "#e2e8f0";

export type ResolvedInputColors = {
  placeholderColor: string;
  backgroundColor: string;
  borderColor: string;
};

export function resolveInputColors(
  config: InputWidgetConfig,
  design: QuizDesignSettings,
): ResolvedInputColors {
  return {
    placeholderColor: config.placeholderColor ?? design.colors.texts,
    backgroundColor: config.backgroundColor ?? design.colors.background,
    borderColor: config.borderColor ?? INPUT_DEFAULT_BORDER_COLOR,
  };
}

const paddingMap: Record<InputSize, string> = {
  sm: "px-2 py-2",
  md: "px-3 py-2.5",
  lg: "px-4 py-3",
};

const fontSizeMap: Record<InputSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function getInputPaddingClass(paddingSize: InputSize): string {
  return paddingMap[paddingSize];
}

export function getInputFontSizeClass(fontSize: InputSize): string {
  return fontSizeMap[fontSize];
}

const alignMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function getInputAlignClass(
  align: InputWidgetConfig["placeholderAlign"],
): string {
  return alignMap[align];
}
