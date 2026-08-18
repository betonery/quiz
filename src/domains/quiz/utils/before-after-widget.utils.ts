import type { BeforeAfterWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { BeforeAfterSide } from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { getCarouselSlideImageSrc } from "@/domains/quiz/utils/media-source.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function getBeforeAfterSideImageSrc(
  side: BeforeAfterSide,
): string | null {
  if (side.imageType === "emoji") return null;
  return getCarouselSlideImageSrc({
    id: "side",
    text: "",
    imageType: side.imageType,
    emoji: side.emoji,
    url: side.url,
    filePath: side.filePath,
  });
}

export function resolveBeforeAfterField(
  text: string | null | undefined,
  variables?: Record<string, unknown>,
): string {
  if (!text) return "";
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolveBeforeAfterColors(
  config: Pick<
    BeforeAfterWidgetConfig,
    "labelColor" | "disclaimerColor" | "accentColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    label: config.labelColor ?? design.colors.titles,
    disclaimer: config.disclaimerColor ?? design.colors.texts,
    accent: config.accentColor ?? design.colors.primary,
  };
}

export function clampSliderPosition(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
