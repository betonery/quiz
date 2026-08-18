"use client";

import type { PricingWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  formatPricingInstallment,
  formatPricingPrice,
  resolvePricingColors,
  resolvePricingField,
} from "@/domains/quiz/utils/pricing-widget.utils";
import { resolveLinkUrl } from "@/domains/quiz/utils/variable-template.utils";
import { cn } from "@/lib/utils";

type PricingWidgetRendererProps = {
  config: PricingWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  mode?: "edit" | "preview" | "player";
  className?: string;
};

function renderText(
  raw: string | null | undefined,
  resolved: string,
  highlightVariables: boolean,
) {
  if (!raw) return null;
  if (highlightVariables) {
    return <VariableHighlightedText text={raw} />;
  }
  return resolved;
}

export function PricingWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  mode = "edit",
  className,
}: PricingWidgetRendererProps) {
  const colors = resolvePricingColors(config, design);
  const title = resolvePricingField(config.title, variables);
  const subtitle = resolvePricingField(config.subtitle, variables);
  const badgeText = resolvePricingField(config.badgeText, variables);
  const ctaLabel = resolvePricingField(config.ctaLabel, variables);
  const installmentLabel = formatPricingInstallment(config);

  const ctaUrl =
    config.ctaUrl && mode === "player"
      ? resolveLinkUrl(config.ctaUrl, variables ?? {})
      : config.ctaUrl;

  const ctaStyle = {
    backgroundColor: colors.highlight,
    color: "#ffffff",
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border-2 p-5 shadow-sm",
        className,
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.highlight,
      }}
    >
      {config.badgeText ? (
        <span
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: colors.badgeBackground,
            color: colors.badgeText,
          }}
        >
          {renderText(config.badgeText, badgeText, highlightVariables)}
        </span>
      ) : null}

      <div className="space-y-3 pr-24">
        {config.title ? (
          <p
            className="text-lg font-semibold leading-tight [font-family:var(--quiz-font-body)]"
            style={{ color: colors.title }}
          >
            {renderText(config.title, title, highlightVariables)}
          </p>
        ) : null}

        {config.subtitle ? (
          <p
            className="text-sm leading-relaxed [font-family:var(--quiz-font-body)]"
            style={{ color: colors.subtitle }}
          >
            {renderText(config.subtitle, subtitle, highlightVariables)}
          </p>
        ) : null}

        <div className="space-y-1">
          {config.showComparePrice && config.comparePriceCents ? (
            <p
              className="text-sm tabular-nums line-through opacity-70 [font-family:var(--quiz-font-body)]"
              style={{ color: colors.comparePrice }}
            >
              {formatPricingPrice(config.comparePriceCents)}
            </p>
          ) : null}
          <p
            className="text-3xl font-bold tabular-nums [font-family:var(--quiz-font-body)]"
            style={{ color: colors.price }}
          >
            {formatPricingPrice(config.priceCents)}
          </p>
          {installmentLabel ? (
            <p
              className="text-sm tabular-nums [font-family:var(--quiz-font-body)]"
              style={{ color: colors.subtitle }}
            >
              {installmentLabel}
            </p>
          ) : null}
        </div>
      </div>

      {config.ctaLabel && config.ctaUrl ? (
        mode === "player" && ctaUrl ? (
          <a
            href={ctaUrl}
            target={config.ctaOpenInNewTab ? "_blank" : "_self"}
            rel={config.ctaOpenInNewTab ? "noopener noreferrer" : undefined}
            className="mt-4 flex w-full items-center justify-center rounded-xl px-4 py-3 text-center text-base font-semibold transition-opacity hover:opacity-90"
            style={ctaStyle}
          >
            {renderText(config.ctaLabel, ctaLabel, highlightVariables)}
          </a>
        ) : (
          <div
            className="mt-4 flex w-full items-center justify-center rounded-xl px-4 py-3 text-center text-base font-semibold"
            style={ctaStyle}
          >
            {renderText(config.ctaLabel, ctaLabel, highlightVariables)}
          </div>
        )
      ) : null}
    </div>
  );
}
