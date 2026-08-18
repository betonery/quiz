import type { ResultBlockWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { ResultBlockVariant } from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { getMediaImageSrc } from "@/domains/quiz/utils/media-source.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolveResultBlockField(
  text: string,
  variables?: Record<string, unknown>,
): string {
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function parseScoreValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function matchesScoreRange(
  score: number,
  variant: ResultBlockVariant,
): boolean {
  const minOk = variant.minScore === null || score >= variant.minScore;
  const maxOk = variant.maxScore === null || score <= variant.maxScore;
  return minOk && maxOk;
}

export function resolveResultVariant(
  config: Pick<
    ResultBlockWidgetConfig,
    "mode" | "scoreVariableKey" | "variants" | "defaultVariantId"
  >,
  variables?: Record<string, unknown>,
): ResultBlockVariant | null {
  if (config.mode === "single" || !config.scoreVariableKey || !variables) {
    return null;
  }

  const raw = variables[config.scoreVariableKey];
  const score = parseScoreValue(raw);
  if (score === null) {
    return (
      config.variants.find((v) => v.id === config.defaultVariantId) ??
      config.variants[0] ??
      null
    );
  }

  const matched =
    config.variants.find((variant) => matchesScoreRange(score, variant)) ??
    config.variants.find((v) => v.id === config.defaultVariantId) ??
    config.variants[0] ??
    null;

  return matched;
}

export function resolveResultBlockContent(
  config: ResultBlockWidgetConfig,
  variables?: Record<string, unknown>,
) {
  const variant = resolveResultVariant(config, variables);

  if (config.mode === "by_score" && variant) {
    return {
      title: resolveResultBlockField(variant.title, variables),
      description: resolveResultBlockField(variant.description, variables),
      imageSrc: variant.showImage
        ? getMediaImageSrc(variant.imageSource)
        : null,
      showImage: variant.showImage,
    };
  }

  return {
    title: resolveResultBlockField(config.title, variables),
    description: resolveResultBlockField(config.description, variables),
    imageSrc: config.showImage ? getMediaImageSrc(config.imageSource) : null,
    showImage: config.showImage,
  };
}

export function resolveResultBlockScoreLabel(
  config: Pick<ResultBlockWidgetConfig, "scoreVariableKey">,
  variables?: Record<string, unknown>,
): string | null {
  if (!config.scoreVariableKey || !variables) return null;
  const score = parseScoreValue(variables[config.scoreVariableKey]);
  if (score === null) return null;
  return new Intl.NumberFormat("pt-BR").format(score);
}

export function resolveResultBlockColors(
  config: Pick<
    ResultBlockWidgetConfig,
    | "backgroundColor"
    | "borderColor"
    | "titleColor"
    | "descriptionColor"
    | "badgeColor"
    | "badgeTextColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    background: config.backgroundColor ?? design.colors.background,
    border: config.borderColor ?? `${design.colors.primary}33`,
    title: config.titleColor ?? design.colors.titles,
    description: config.descriptionColor ?? design.colors.texts,
    badge: config.badgeColor ?? design.colors.primary,
    badgeText: config.badgeTextColor ?? "#ffffff",
  };
}
