"use client";

import type { ResultBlockWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  resolveResultBlockColors,
  resolveResultBlockContent,
  resolveResultBlockScoreLabel,
} from "@/domains/quiz/utils/result-block-widget.utils";
import { cn } from "@/lib/utils";

type ResultBlockWidgetRendererProps = {
  config: ResultBlockWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

function renderField(
  raw: string,
  resolved: string,
  highlightVariables: boolean,
) {
  if (highlightVariables) return <VariableHighlightedText text={raw} />;
  return resolved;
}

export function ResultBlockWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: ResultBlockWidgetRendererProps) {
  const colors = resolveResultBlockColors(config, design);
  const content = resolveResultBlockContent(config, variables);
  const scoreLabel = resolveResultBlockScoreLabel(config, variables);
  const isHero = config.layout === "hero";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border p-5 shadow-sm",
        isHero ? "space-y-4" : "space-y-3",
        className,
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      {config.showScoreBadge && scoreLabel ? (
        <span
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold tabular-nums"
          style={{ backgroundColor: colors.badge, color: colors.badgeText }}
        >
          {scoreLabel} pts
        </span>
      ) : null}

      {content.showImage && content.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.imageSrc}
          alt=""
          className={cn(
            "w-full object-cover",
            isHero ? "h-48 rounded-xl" : "h-32 rounded-lg",
          )}
        />
      ) : null}

      <div className={cn(config.showScoreBadge && scoreLabel && "pr-20")}>
        <p
          className={cn(
            "font-semibold leading-tight [font-family:var(--quiz-font-body)]",
            isHero ? "text-2xl" : "text-lg",
          )}
          style={{ color: colors.title }}
        >
          {renderField(
            config.mode === "by_score" ? content.title : config.title,
            content.title,
            highlightVariables && config.mode === "single",
          )}
        </p>
        <p
          className="mt-2 text-sm leading-relaxed [font-family:var(--quiz-font-body)]"
          style={{ color: colors.description }}
        >
          {renderField(
            config.mode === "by_score"
              ? content.description
              : config.description,
            content.description,
            highlightVariables && config.mode === "single",
          )}
        </p>
      </div>
    </div>
  );
}
