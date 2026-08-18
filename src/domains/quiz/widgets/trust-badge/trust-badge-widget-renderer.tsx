"use client";

import { Award, ShieldCheck, Shield, Truck } from "lucide-react";
import type { TrustBadgeWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { TrustBadgePreset } from "@/domains/quiz/types/media.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  getTrustBadgeImageSrc,
  resolveTrustBadgeColors,
  resolveTrustBadgeField,
} from "@/domains/quiz/utils/trust-badge-widget.utils";
import { cn } from "@/lib/utils";

type TrustBadgeWidgetRendererProps = {
  config: TrustBadgeWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

const PRESET_ICONS: Record<
  TrustBadgePreset,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  guarantee: ShieldCheck,
  security: Shield,
  delivery: Truck,
  certificate: Award,
  custom: ShieldCheck,
};

export function TrustBadgeWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: TrustBadgeWidgetRendererProps) {
  const colors = resolveTrustBadgeColors(config, design);
  const title = resolveTrustBadgeField(config.title, variables);
  const subtitle = resolveTrustBadgeField(config.subtitle, variables);
  const isInline = config.layout === "inline";

  const PresetIcon = PRESET_ICONS[config.preset];
  const imageSrc =
    config.iconType === "image" ? getTrustBadgeImageSrc(config) : null;

  function renderIcon() {
    if (config.iconType === "emoji" && config.emoji) {
      return (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/60 text-2xl">
          {config.emoji}
        </span>
      );
    }

    if (config.iconType === "image" && imageSrc) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          className="size-12 shrink-0 rounded-full object-cover"
        />
      );
    }

    return (
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${colors.icon}22`, color: colors.icon }}
      >
        <PresetIcon className="size-6" />
      </span>
    );
  }

  return (
    <div
      className={cn(
        "w-full border",
        isInline
          ? "flex items-center gap-4 rounded-xl px-4 py-3"
          : "rounded-2xl p-5 shadow-sm",
        className,
      )}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      {renderIcon()}
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="text-sm font-semibold leading-snug [font-family:var(--quiz-font-body)]"
          style={{ color: colors.title }}
        >
          {highlightVariables ? (
            <VariableHighlightedText text={config.title} />
          ) : (
            title
          )}
        </p>
        <p
          className="text-xs leading-relaxed [font-family:var(--quiz-font-body)]"
          style={{ color: colors.subtitle }}
        >
          {highlightVariables ? (
            <VariableHighlightedText text={config.subtitle} />
          ) : (
            subtitle
          )}
        </p>
      </div>
    </div>
  );
}
