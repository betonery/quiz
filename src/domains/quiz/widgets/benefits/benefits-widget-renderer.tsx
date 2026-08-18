"use client";

import { Check, Circle, Star, X } from "lucide-react";
import type { BenefitsWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { BenefitIcon } from "@/domains/quiz/types/media.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  resolveBenefitText,
  resolveBenefitsColors,
} from "@/domains/quiz/utils/benefits-widget.utils";
import { cn } from "@/lib/utils";

type BenefitsWidgetRendererProps = {
  config: BenefitsWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

const ICON_MAP: Record<
  BenefitIcon,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  check: Check,
  x: X,
  star: Star,
  dot: Circle,
};

function BenefitIconView({
  icon,
  color,
}: {
  icon: BenefitIcon;
  color: string;
}) {
  const Icon = ICON_MAP[icon];
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}22`, color }}
    >
      <Icon
        className={cn("size-3.5", icon === "dot" && "size-2 fill-current")}
      />
    </span>
  );
}

export function BenefitsWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: BenefitsWidgetRendererProps) {
  const colors = resolveBenefitsColors(config, design);
  const isCards = config.layout === "cards";

  return (
    <div className={cn("w-full space-y-3", className)}>
      {config.items.map((item) => {
        const text = resolveBenefitText(item.text, variables);
        const content = highlightVariables ? (
          <VariableHighlightedText text={item.text} />
        ) : (
          text
        );

        return (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3",
              isCards && "rounded-xl border p-4 shadow-sm",
            )}
            style={
              isCards
                ? {
                    backgroundColor: colors.cardBackground,
                    borderColor: `${colors.icon}33`,
                  }
                : undefined
            }
          >
            <BenefitIconView icon={item.icon} color={colors.icon} />
            <p
              className="min-w-0 flex-1 text-sm leading-relaxed [font-family:var(--quiz-font-body)]"
              style={{ color: colors.text }}
            >
              {content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
