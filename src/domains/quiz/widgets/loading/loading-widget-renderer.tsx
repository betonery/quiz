"use client";

import type { LoadingWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import { useAnimatedPercentage } from "@/domains/quiz/hooks/use-animated-percentage";
import {
  clampLoadingLimitPercent,
  resolveLoadingColors,
} from "@/domains/quiz/utils/loading-widget.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";
import { cn } from "@/lib/utils";

type LoadingWidgetRendererProps = {
  config: LoadingWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  animate?: boolean;
  highlightVariables?: boolean;
  className?: string;
};

function renderText(
  text: string,
  highlightVariables: boolean,
  className?: string,
  style?: React.CSSProperties,
) {
  if (highlightVariables) {
    return (
      <VariableHighlightedText
        text={text}
        className={className}
        style={style}
      />
    );
  }

  return (
    <span className={className} style={style}>
      {text}
    </span>
  );
}

export function LoadingWidgetRenderer({
  config,
  design,
  variables,
  animate = true,
  highlightVariables = false,
  className,
}: LoadingWidgetRendererProps) {
  const colors = resolveLoadingColors(config, design);
  const targetPercent = clampLoadingLimitPercent(config.limitPercent);
  const durationMs = config.durationSeconds * 1000;
  const { value: animatedPercent } = useAnimatedPercentage(targetPercent, {
    animate,
    durationMs,
  });

  const title = variables
    ? resolveTemplate(config.title, variables)
    : config.title;
  const description = variables
    ? resolveTemplate(config.description, variables)
    : config.description;

  const displayPercent = Math.round(animatedPercent);
  const showHeader = config.showTitle || config.showMeter;

  return (
    <div className={cn("w-full rounded-xl bg-white p-4", className)}>
      {showHeader ? (
        <div className="flex items-start justify-between gap-4">
          {config.showTitle && title ? (
            <p
              className="min-w-0 text-base font-semibold leading-tight"
              style={{ color: colors.title }}
            >
              {renderText(title, highlightVariables)}
            </p>
          ) : (
            <span />
          )}
          {config.showMeter ? (
            <span
              className="shrink-0 text-sm font-medium tabular-nums"
              style={{ color: colors.text }}
            >
              {displayPercent}%
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn("relative h-3 w-full rounded-full", showHeader && "mt-4")}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: colors.track }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${animatedPercent}%`,
            backgroundColor: colors.fill,
          }}
        />
      </div>

      {description ? (
        <p
          className="mt-3 text-center text-sm leading-snug"
          style={{ color: colors.text }}
        >
          {renderText(description, highlightVariables)}
        </p>
      ) : null}
    </div>
  );
}
