"use client";

import { AlertTriangle, CheckCircle2, Gift, Info } from "lucide-react";
import type { AlertWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { AlertIcon } from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  resolveAlertColors,
  resolveAlertField,
  resolveAlertIcon,
} from "@/domains/quiz/utils/alert-widget.utils";
import { cn } from "@/lib/utils";

type AlertWidgetRendererProps = {
  config: AlertWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

const ICON_MAP: Record<
  AlertIcon,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  info: Info,
  check: CheckCircle2,
  alert: AlertTriangle,
  gift: Gift,
};

function renderText(
  raw: string,
  resolved: string,
  highlightVariables: boolean,
) {
  if (highlightVariables) return <VariableHighlightedText text={raw} />;
  return resolved;
}

export function AlertWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: AlertWidgetRendererProps) {
  const colors = resolveAlertColors(config, design);
  const iconKey = resolveAlertIcon(config);
  const Icon = ICON_MAP[iconKey];
  const title = resolveAlertField(config.title, variables);
  const body = resolveAlertField(config.body, variables);

  return (
    <div
      className={cn(
        "flex w-full gap-3 rounded-xl border-l-4 p-4 shadow-sm",
        className,
      )}
      style={{
        backgroundColor: colors.background,
        borderLeftColor: colors.border,
      }}
    >
      {config.showIcon ? (
        <Icon
          className="mt-0.5 size-5 shrink-0"
          style={{ color: colors.icon }}
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="text-sm font-semibold leading-snug [font-family:var(--quiz-font-body)]"
          style={{ color: colors.title }}
        >
          {renderText(config.title, title, highlightVariables)}
        </p>
        <p
          className="text-sm leading-relaxed [font-family:var(--quiz-font-body)]"
          style={{ color: colors.body }}
        >
          {renderText(config.body, body, highlightVariables)}
        </p>
      </div>
    </div>
  );
}
