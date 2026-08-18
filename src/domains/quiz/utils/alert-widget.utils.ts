import type { AlertWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { AlertIcon, AlertVariant } from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

type AlertPreset = {
  background: string;
  border: string;
  icon: string;
  title: string;
  body: string;
  defaultIcon: AlertIcon;
};

export const ALERT_VARIANT_PRESETS: Record<AlertVariant, AlertPreset> = {
  info: {
    background: "#eff6ff",
    border: "#3b82f6",
    icon: "#2563eb",
    title: "#1e3a8a",
    body: "#1e40af",
    defaultIcon: "info",
  },
  success: {
    background: "#ecfdf5",
    border: "#10b981",
    icon: "#059669",
    title: "#065f46",
    body: "#047857",
    defaultIcon: "check",
  },
  warning: {
    background: "#fffbeb",
    border: "#f59e0b",
    icon: "#d97706",
    title: "#92400e",
    body: "#b45309",
    defaultIcon: "alert",
  },
  promo: {
    background: "#fdf4ff",
    border: "#a855f7",
    icon: "#9333ea",
    title: "#581c87",
    body: "#6b21a8",
    defaultIcon: "gift",
  },
};

export function resolveAlertField(
  text: string,
  variables?: Record<string, unknown>,
): string {
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolveAlertColors(
  config: Pick<
    AlertWidgetConfig,
    | "variant"
    | "backgroundColor"
    | "borderColor"
    | "titleColor"
    | "bodyColor"
    | "iconColor"
  >,
  design: QuizDesignSettings,
) {
  const preset = ALERT_VARIANT_PRESETS[config.variant];
  const promoPrimary = {
    background: `${design.colors.primary}12`,
    border: design.colors.primary,
    icon: design.colors.primary,
    title: design.colors.titles,
    body: design.colors.texts,
  };

  const base = config.variant === "promo" ? promoPrimary : preset;

  return {
    background: config.backgroundColor ?? base.background,
    border: config.borderColor ?? base.border,
    icon: config.iconColor ?? base.icon,
    title: config.titleColor ?? base.title,
    body: config.bodyColor ?? base.body,
  };
}

export function resolveAlertIcon(
  config: Pick<AlertWidgetConfig, "variant" | "icon">,
): AlertIcon {
  if (config.icon) return config.icon;
  return ALERT_VARIANT_PRESETS[config.variant].defaultIcon;
}

export function getAlertPresetCopy(variant: AlertVariant): {
  title: string;
  body: string;
} {
  const copies: Record<AlertVariant, { title: string; body: string }> = {
    info: {
      title: "Informação importante",
      body: "Use este espaço para comunicar detalhes relevantes ao visitante.",
    },
    success: {
      title: "Parabéns!",
      body: "Você está apto a avançar para a próxima etapa.",
    },
    warning: {
      title: "Atenção",
      body: "Leia com atenção antes de continuar.",
    },
    promo: {
      title: "Bônus exclusivo!",
      body: "Garanta acesso imediato ao material complementar por tempo limitado.",
    },
  };
  return copies[variant];
}
