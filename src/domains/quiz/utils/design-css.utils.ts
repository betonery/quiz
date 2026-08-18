import type { CSSProperties } from "react";
import { getGoogleFontsUrl } from "@/constants/google-fonts";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";

export function getDesignCssVariables(
  design: QuizDesignSettings,
): CSSProperties {
  return {
    ["--quiz-color-primary" as string]: design.colors.primary,
    ["--quiz-color-bg" as string]: design.colors.background,
    ["--quiz-color-title" as string]: design.colors.titles,
    ["--quiz-color-text" as string]: design.colors.texts,
    ["--quiz-color-interactive" as string]: design.colors.interactiveTexts,
    ["--quiz-font-title" as string]: `"${design.typography.titleFont}", sans-serif`,
    ["--quiz-font-body" as string]: `"${design.typography.bodyFont}", sans-serif`,
    backgroundColor: design.colors.background,
    color: design.colors.texts,
    fontFamily: `"${design.typography.bodyFont}", sans-serif`,
  };
}

export function getDesignFontsUrl(design: QuizDesignSettings): string {
  return getGoogleFontsUrl([
    design.typography.titleFont,
    design.typography.bodyFont,
  ]);
}

export function getQuizAssetPublicUrl(filePath?: string): string | null {
  if (!filePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/quiz-assets/${filePath}`;
}
