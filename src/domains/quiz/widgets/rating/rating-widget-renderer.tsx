"use client";

import { Star } from "lucide-react";
import type { RatingWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  resolveRatingColors,
  resolveRatingField,
  resolveRatingScore,
} from "@/domains/quiz/utils/rating-widget.utils";
import {
  formatRatingScore,
  getStarFillState,
} from "@/domains/quiz/utils/star-rating.utils";
import { cn } from "@/lib/utils";

type RatingWidgetRendererProps = {
  config: RatingWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

function StarIcon({
  fill,
  color,
}: {
  fill: "full" | "half" | "empty";
  color: string;
}) {
  if (fill === "half") {
    return (
      <span className="relative inline-flex size-5">
        <Star className="size-5 fill-transparent text-slate-300" />
        <Star
          className="absolute inset-0 size-5 fill-current"
          style={{ color, clipPath: "inset(0 50% 0 0)" }}
        />
      </span>
    );
  }

  return (
    <Star
      className={cn(
        "size-5",
        fill === "full" ? "fill-current" : "fill-transparent text-slate-300",
      )}
      style={fill === "full" ? { color } : undefined}
    />
  );
}

export function RatingWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: RatingWidgetRendererProps) {
  const colors = resolveRatingColors(config, design);
  const score = resolveRatingScore(config, variables);
  const totalReviews = resolveRatingField(config.totalReviewsText, variables);
  const subtitle = resolveRatingField(config.subtitle, variables);
  const isInline = config.layout === "inline";

  return (
    <div
      className={cn(
        "w-full",
        isInline
          ? "flex flex-wrap items-center justify-center gap-3"
          : "flex flex-col items-center gap-2 text-center",
        className,
      )}
    >
      <p
        className="text-3xl font-bold tabular-nums [font-family:var(--quiz-font-body)]"
        style={{ color: colors.score }}
      >
        {formatRatingScore(score)}
      </p>
      <div className="flex items-center gap-0.5" aria-label={`${score} de 5`}>
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            fill={getStarFillState(score, index, config.showHalfStars)}
            color={colors.star}
          />
        ))}
      </div>
      <div className={cn(isInline ? "text-left" : "text-center")}>
        <p
          className="text-sm font-medium [font-family:var(--quiz-font-body)]"
          style={{ color: colors.score }}
        >
          {highlightVariables ? (
            <VariableHighlightedText text={config.totalReviewsText} />
          ) : (
            totalReviews
          )}
        </p>
        {config.subtitle ? (
          <p
            className="text-xs [font-family:var(--quiz-font-body)]"
            style={{ color: colors.subtitle }}
          >
            {highlightVariables ? (
              <VariableHighlightedText text={config.subtitle} />
            ) : (
              subtitle
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
