import type { TrustBadgePreset } from "@/domains/quiz/types/media.types";
import type { TrustBadgeWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export const TRUST_BADGE_PRESET_COPY: Record<
  TrustBadgePreset,
  { title: string; subtitle: string }
> = {
  guarantee: {
    title: "Garantia de 7 dias",
    subtitle: "Devolução do seu dinheiro",
  },
  security: {
    title: "Compra 100% segura",
    subtitle: "Seus dados estão protegidos",
  },
  delivery: {
    title: "Entrega garantida",
    subtitle: "Enviamos para todo o Brasil",
  },
  certificate: {
    title: "Certificado incluso",
    subtitle: "Comprove seu aprendizado",
  },
  custom: {
    title: "Selo de confiança",
    subtitle: "Compra verificada",
  },
};

export function resolveTrustBadgeField(
  text: string,
  variables?: Record<string, unknown>,
): string {
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolveTrustBadgeColors(
  config: Pick<
    TrustBadgeWidgetConfig,
    | "backgroundColor"
    | "borderColor"
    | "iconColor"
    | "titleColor"
    | "subtitleColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    background: config.backgroundColor ?? `${design.colors.primary}10`,
    border: config.borderColor ?? `${design.colors.primary}33`,
    icon: config.iconColor ?? design.colors.primary,
    title: config.titleColor ?? design.colors.titles,
    subtitle: config.subtitleColor ?? design.colors.texts,
  };
}

export function getTrustBadgeImageSrc(
  config: Pick<TrustBadgeWidgetConfig, "imageSource">,
): string | null {
  const source = config.imageSource;
  if (source.sourceType === "url" && source.url?.trim()) {
    return source.url.trim();
  }
  if (source.sourceType === "file" && source.filePath?.trim()) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/quiz-assets/${source.filePath}`;
  }
  return null;
}
