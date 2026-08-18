"use client";

import type { LevelWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import { useAnimatedPercentage } from "@/domains/quiz/hooks/use-animated-percentage";
import {
  clampLevelPercentage,
  getLevelSpacingClass,
  parseLevelLegends,
  resolveLevelColors,
} from "@/domains/quiz/utils/level-widget.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";
import { cn } from "@/lib/utils";

type LevelWidgetRendererProps = {
  config: LevelWidgetConfig;
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

export function LevelWidgetRenderer({
  config,
  design,
  variables,
  animate = true,
  highlightVariables = false,
  className,
}: LevelWidgetRendererProps) {
  const colors = resolveLevelColors(config, design);
  const targetPercentage = clampLevelPercentage(config.percentage);
  const { value: animatedPercent } = useAnimatedPercentage(targetPercentage, {
    animate,
  });

  const title = variables
    ? resolveTemplate(config.title, variables)
    : config.title;
  const subtitle = variables
    ? resolveTemplate(config.subtitle, variables)
    : config.subtitle;
  const indicatorText = variables
    ? resolveTemplate(config.indicatorText, variables)
    : config.indicatorText;
  const legends = parseLevelLegends(
    variables ? resolveTemplate(config.legends, variables) : config.legends,
  );

  const displayPercent = Math.round(animatedPercent);

  return (
    <div
      className={cn(
        "w-full rounded-xl bg-white",
        getLevelSpacingClass(config.spacing),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {title ? (
            <p
              className="text-base font-bold leading-tight"
              style={{ color: colors.title }}
            >
              {renderText(title, highlightVariables)}
            </p>
          ) : null}
          {subtitle ? (
            <p
              className="mt-0.5 text-sm leading-snug"
              style={{ color: colors.text }}
            >
              {renderText(subtitle, highlightVariables)}
            </p>
          ) : null}
        </div>
        {config.showMeter ? (
          <span
            className="shrink-0 text-sm font-medium tabular-nums"
            style={{ color: colors.text }}
          >
            {displayPercent}%
          </span>
        ) : null}
      </div>

      <div className="relative mt-4">
        {config.showProgress && indicatorText ? (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-3 -translate-x-1/2 whitespace-nowrap"
            style={{
              left: `${animatedPercent}%`,
            }}
          >
            <div
              className="relative rounded-md px-2.5 py-1 text-xs font-medium shadow-sm"
              style={{
                backgroundColor: colors.tooltipBackground,
                color: colors.tooltipText,
              }}
            >
              {renderText(indicatorText, highlightVariables)}
              <span
                className="absolute top-full left-1/2 size-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent"
                style={{ borderTopColor: colors.tooltipBackground }}
                aria-hidden
              />
            </div>
          </div>
        ) : null}

        <div
          className="relative h-3 w-full overflow-visible rounded-full"
          style={{ backgroundColor: colors.track }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${animatedPercent}%`,
              backgroundColor: colors.fill,
            }}
          />
          {config.showProgress ? (
            <div
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-sm"
              style={{
                left: `${animatedPercent}%`,
                borderColor: colors.border,
              }}
            />
          ) : null}
        </div>
      </div>

      {legends.length > 0 ? (
        <div
          className="mt-3 flex justify-between gap-2 text-xs"
          style={{ color: colors.text }}
        >
          {legends.map((legend, index) => (
            <span key={`${legend}-${index}`} className="min-w-0 text-center">
              {renderText(legend, highlightVariables)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
