"use client";

import { useEffect, useRef, useState } from "react";
import type { CountdownWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  didCountdownReachZero,
  formatCountdownParts,
  getCountdownEndTimestamp,
  getCountdownPlaceholderSeconds,
  getRemainingSeconds,
  padCountdownUnit,
  resolveCountdownColors,
} from "@/domains/quiz/utils/countdown-widget.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";
import { cn } from "@/lib/utils";

type CountdownWidgetRendererProps = {
  config: CountdownWidgetConfig;
  design: QuizDesignSettings;
  widgetId: string;
  quizSlug?: string;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  mode?: "edit" | "preview" | "player";
  onExpire?: () => void;
  className?: string;
};

function resolveLabel(
  text: string | null | undefined,
  variables?: Record<string, unknown>,
): string {
  if (!text) return "";
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

function CountdownUnit({
  value,
  label,
  digitBackground,
  digitText,
  labelColor,
}: {
  value: string;
  label: string;
  digitBackground: string;
  digitText: string;
  labelColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex min-w-[3.25rem] items-center justify-center rounded-xl px-3 py-2 text-2xl font-bold tabular-nums shadow-sm"
        style={{ backgroundColor: digitBackground, color: digitText }}
      >
        {value}
      </div>
      <span
        className="text-[10px] font-medium uppercase tracking-wide [font-family:var(--quiz-font-body)]"
        style={{ color: labelColor }}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownWidgetRenderer({
  config,
  design,
  widgetId,
  quizSlug = "preview",
  variables,
  highlightVariables = false,
  mode = "edit",
  onExpire,
  className,
}: CountdownWidgetRendererProps) {
  const colors = resolveCountdownColors(config, design);
  const hasTriggeredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const usesRuntimeClock = mode === "player" || mode === "preview";
  const [isRuntimeReady, setIsRuntimeReady] = useState(!usesRuntimeClock);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    mode === "edit"
      ? config.sessionDurationSeconds
      : getCountdownPlaceholderSeconds(config),
  );

  useEffect(() => {
    if (mode === "edit") return;

    hasTriggeredRef.current = false;

    const endTimestamp = getCountdownEndTimestamp(config, quizSlug, widgetId);
    let previousRemaining = getRemainingSeconds(endTimestamp);

    setRemainingSeconds(previousRemaining);
    setIsRuntimeReady(true);

    if (
      mode === "player" &&
      config.flowOutputEnabled &&
      config.mode === "fixed" &&
      previousRemaining <= 0
    ) {
      hasTriggeredRef.current = true;
      onExpireRef.current?.();
    }

    const tick = () => {
      const nextRemaining = getRemainingSeconds(endTimestamp);

      if (
        mode === "player" &&
        config.flowOutputEnabled &&
        didCountdownReachZero(previousRemaining, nextRemaining) &&
        !hasTriggeredRef.current
      ) {
        hasTriggeredRef.current = true;
        onExpireRef.current?.();
      }

      previousRemaining = nextRemaining;
      setRemainingSeconds(nextRemaining);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, [config, mode, quizSlug, widgetId]);

  const labelAbove = resolveLabel(config.labelAbove, variables);
  const labelBelow = resolveLabel(config.labelBelow, variables);
  const expiredMessage = resolveLabel(config.expiredMessage, variables);

  const showExpiredMessage =
    isRuntimeReady && mode === "player" && remainingSeconds <= 0;

  if (showExpiredMessage) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border px-4 py-3 text-center text-sm font-medium [font-family:var(--quiz-font-body)]",
          className,
        )}
        style={{ borderColor: colors.accent, color: colors.label }}
      >
        {expiredMessage || "Esta oferta expirou."}
      </div>
    );
  }

  const parts =
    mode === "edit"
      ? formatCountdownParts(config.sessionDurationSeconds, config.showDays)
      : formatCountdownParts(remainingSeconds, config.showDays);

  const units: { value: string; label: string }[] = [];
  if (config.showDays) {
    units.push({ value: padCountdownUnit(parts.days), label: "Dias" });
  }
  units.push(
    { value: padCountdownUnit(parts.hours), label: "Horas" },
    { value: padCountdownUnit(parts.minutes), label: "Min" },
    { value: padCountdownUnit(parts.seconds), label: "Seg" },
  );

  return (
    <div
      className={cn("w-full rounded-2xl border px-4 py-5 shadow-sm", className)}
      style={{ borderColor: colors.accent }}
    >
      {config.labelAbove ? (
        <p
          className="mb-4 text-center text-sm font-medium [font-family:var(--quiz-font-body)]"
          style={{ color: colors.label }}
        >
          {highlightVariables ? (
            <VariableHighlightedText text={config.labelAbove} />
          ) : (
            labelAbove
          )}
        </p>
      ) : null}

      <div className="flex items-center justify-center gap-2">
        {units.map((unit, index) => (
          <div key={unit.label} className="flex items-center gap-2">
            <CountdownUnit
              value={unit.value}
              label={unit.label}
              digitBackground={colors.digitBackground}
              digitText={colors.digitText}
              labelColor={colors.label}
            />
            {index < units.length - 1 ? (
              <span
                className="pb-5 text-2xl font-bold tabular-nums"
                style={{ color: colors.separator }}
              >
                :
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {config.labelBelow ? (
        <p
          className="mt-4 text-center text-xs [font-family:var(--quiz-font-body)]"
          style={{ color: colors.label }}
        >
          {highlightVariables ? (
            <VariableHighlightedText text={config.labelBelow} />
          ) : (
            labelBelow
          )}
        </p>
      ) : null}
    </div>
  );
}
