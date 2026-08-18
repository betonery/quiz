import type { PricingWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  formatCurrencyBRL,
  formatInstallmentBRL,
} from "@/domains/quiz/utils/currency.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolvePricingField(
  text: string | null | undefined,
  variables?: Record<string, unknown>,
): string {
  if (!text) return "";
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolvePricingColors(
  config: Pick<
    PricingWidgetConfig,
    | "highlightColor"
    | "backgroundColor"
    | "titleColor"
    | "priceColor"
    | "comparePriceColor"
    | "subtitleColor"
    | "badgeBackgroundColor"
    | "badgeTextColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    highlight: config.highlightColor ?? design.colors.primary,
    background: config.backgroundColor ?? design.colors.background,
    title: config.titleColor ?? design.colors.titles,
    price: config.priceColor ?? design.colors.primary,
    comparePrice: config.comparePriceColor ?? design.colors.texts,
    subtitle: config.subtitleColor ?? design.colors.texts,
    badgeBackground: config.badgeBackgroundColor ?? design.colors.primary,
    badgeText: config.badgeTextColor ?? "#ffffff",
  };
}

export function getInstallmentLabel(
  config: PricingWidgetConfig,
): string | null {
  if (!config.showInstallments || !config.installmentCount) return null;

  const installmentCents =
    config.installmentCents ??
    Math.round(config.priceCents / config.installmentCount);

  return formatInstallmentBRL(
    installmentCents * config.installmentCount,
    config.installmentCount,
  ).replace(
    formatCurrencyBRL(installmentCents * config.installmentCount),
    formatCurrencyBRL(installmentCents),
  );
}

export function formatPricingInstallment(
  config: PricingWidgetConfig,
): string | null {
  if (!config.showInstallments || !config.installmentCount) return null;

  const installmentCents =
    config.installmentCents ??
    Math.round(config.priceCents / config.installmentCount);

  return `${config.installmentCount}x de ${formatCurrencyBRL(installmentCents)}`;
}

export function formatPricingPrice(cents: number): string {
  return formatCurrencyBRL(cents);
}
