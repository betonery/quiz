import type { LogoBarWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { getMediaImageSrc } from "@/domains/quiz/utils/media-source.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolveLogoBarTitle(
  title: string | null | undefined,
  variables?: Record<string, unknown>,
): string {
  if (!title) return "";
  if (!variables) return title;
  return resolveTemplate(title, variables);
}

export function resolveLogoBarColors(
  config: Pick<LogoBarWidgetConfig, "titleColor">,
  design: QuizDesignSettings,
) {
  return {
    title: config.titleColor ?? design.colors.texts,
  };
}

export function getLogoBarItemSrc(
  item: LogoBarWidgetConfig["items"][number],
): string | null {
  return getMediaImageSrc(item.imageSource);
}

export function clampLogoBarItemHeight(value: number): number {
  return Math.min(80, Math.max(24, Math.round(value)));
}

export function getLogoBarMarqueeDurationSec(
  autoplayDelayMs: number,
  itemCount: number,
): number {
  const safeCount = Math.max(itemCount, 1);
  return Math.max(4, (autoplayDelayMs / 1000) * safeCount);
}
