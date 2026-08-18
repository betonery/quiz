import type { LoadingWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { clampLevelPercentage } from "@/domains/quiz/utils/level-widget.utils";

export function clampLoadingDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return 1;
  return Math.min(120, Math.max(1, Math.round(seconds)));
}

export function clampLoadingLimitPercent(value: number): number {
  return clampLevelPercentage(value);
}

export function resolveLoadingColors(
  config: Pick<LoadingWidgetConfig, "fillColor" | "textColor" | "trackColor">,
  design: QuizDesignSettings,
) {
  return {
    fill: config.fillColor ?? design.colors.primary,
    text: config.textColor ?? design.colors.texts,
    title: config.textColor ?? design.colors.titles,
    track: config.trackColor ?? "#e5e7eb",
  };
}
