import type { SpacerWidgetConfig } from "@/domains/quiz/types/builder.types";

export const SPACER_MIN_HEIGHT_PX = 1;
export const SPACER_MAX_HEIGHT_PX = 500;

export function clampSpacerHeight(value: number): number {
  if (!Number.isFinite(value)) {
    return SPACER_MIN_HEIGHT_PX;
  }

  return Math.min(
    SPACER_MAX_HEIGHT_PX,
    Math.max(SPACER_MIN_HEIGHT_PX, Math.round(value)),
  );
}

export function resolveSpacerBackgroundColor(
  config: Pick<SpacerWidgetConfig, "backgroundColor">,
): string | "transparent" {
  const color = config.backgroundColor?.trim();
  return color ? color : "transparent";
}

export function getSpacerColorPickerValue(
  config: Pick<SpacerWidgetConfig, "backgroundColor">,
): string {
  return config.backgroundColor ?? "#ffffff";
}
