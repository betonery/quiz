import type {
  LevelSpacing,
  LevelWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";

const LEVEL_SPACING_CLASSES: Record<LevelSpacing, string> = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
};

export function clampLevelPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function parseLevelLegends(csv: string): string[] {
  return csv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getLevelSpacingClass(spacing: LevelSpacing): string {
  return LEVEL_SPACING_CLASSES[spacing];
}

export function resolveLevelColors(
  config: Pick<LevelWidgetConfig, "fillColor" | "textColor" | "borderColor">,
  design: QuizDesignSettings,
) {
  return {
    fill: config.fillColor ?? design.colors.primary,
    text: config.textColor ?? design.colors.texts,
    border: config.borderColor ?? "#e2e8f0",
    track: config.borderColor ?? "#e5e7eb",
    title: config.textColor ?? design.colors.titles,
    tooltipBackground: config.fillColor ?? design.colors.primary,
    tooltipText: "#ffffff",
  };
}
