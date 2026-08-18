import type { RatingWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  clampRatingScore,
  parseVariableScore,
} from "@/domains/quiz/utils/star-rating.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolveRatingScore(
  config: Pick<
    RatingWidgetConfig,
    "score" | "useVariableScore" | "scoreVariableKey"
  >,
  variables?: Record<string, unknown>,
): number {
  if (config.useVariableScore && config.scoreVariableKey && variables) {
    const raw = variables[config.scoreVariableKey];
    const parsed = parseVariableScore(raw);
    if (parsed !== null) return parsed;
  }
  return clampRatingScore(config.score);
}

export function resolveRatingField(
  text: string | null | undefined,
  variables?: Record<string, unknown>,
): string {
  if (!text) return "";
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolveRatingColors(
  config: Pick<
    RatingWidgetConfig,
    "starColor" | "scoreColor" | "subtitleColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    star: config.starColor ?? "#fbbf24",
    score: config.scoreColor ?? design.colors.titles,
    subtitle: config.subtitleColor ?? design.colors.texts,
  };
}
