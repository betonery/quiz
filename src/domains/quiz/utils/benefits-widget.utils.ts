import type { BenefitsWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolveBenefitText(
  text: string,
  variables?: Record<string, unknown>,
): string {
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolveBenefitsColors(
  config: Pick<
    BenefitsWidgetConfig,
    "iconColor" | "textColor" | "cardBackgroundColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    icon: config.iconColor ?? design.colors.primary,
    text: config.textColor ?? design.colors.texts,
    cardBackground: config.cardBackgroundColor ?? `${design.colors.primary}14`,
  };
}
