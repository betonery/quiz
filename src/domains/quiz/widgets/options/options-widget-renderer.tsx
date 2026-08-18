"use client";

import { Check } from "lucide-react";
import type {
  OptionItem,
  OptionsWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  getOptionCardClass,
  getOptionFlexClasses,
  getOptionsGapClass,
  getOptionsGridClass,
  getOptionsRadiusClass,
  getOptionsShadowClass,
  resolveOptionsColors,
} from "@/domains/quiz/utils/options-widget-styles.utils";
import {
  isOptionSelected,
  toggleOptionSelection,
} from "@/domains/quiz/utils/options-validation.utils";
import { OptionImagePreview } from "@/domains/quiz/widgets/options/option-image-preview";
import {
  VariableHighlightChip,
  VariableHighlightedText,
} from "@/domains/quiz/components/builder/variable-highlighted-text";
import { cn } from "@/lib/utils";

type OptionsWidgetRendererProps = {
  config: OptionsWidgetConfig;
  design: QuizDesignSettings;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onOptionSelect?: (option: OptionItem) => void;
  error?: string | null;
  readOnly?: boolean;
  highlightVariables?: boolean;
};

export function OptionsWidgetRenderer({
  config,
  design,
  value = "",
  onChange,
  onOptionSelect,
  error,
  readOnly = false,
  highlightVariables = false,
}: OptionsWidgetRendererProps) {
  const colors = resolveOptionsColors(config, design);

  function handleSelect(option: OptionItem) {
    if (readOnly || !onChange) return;
    const next = toggleOptionSelection(option.id, value, config.multipleChoice);
    onChange(next);
    onOptionSelect?.(option);
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          "grid w-full",
          getOptionsGridClass(config.layout),
          getOptionsGapClass(config.spacing),
        )}
      >
        {config.options.map((option) => {
          const selected = isOptionSelected(option.id, value);
          const flex = getOptionFlexClasses(
            config.direction,
            config.disposition,
          );

          const cardStyle = selected
            ? {
                backgroundColor: colors.selectedBackgroundColor,
                borderColor: colors.selectedBorderColor,
                color: colors.selectedTextColor,
              }
            : {
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
                color: colors.textColor,
              };

          const cardClassName = cn(
            "relative w-full p-3 text-left transition-colors",
            getOptionsRadiusClass(config.borderRadius),
            getOptionsShadowClass(config.shadow),
            getOptionCardClass(config.variant),
            readOnly && "pointer-events-none",
            !readOnly && "hover:opacity-90",
            error && !selected && "border-destructive",
          );

          const cardContent = (
            <>
              <div className={cn("w-full", flex.container)}>
                {config.disposition !== "text_only" && (
                  <div className={flex.imageOrder}>
                    <OptionImagePreview
                      option={option}
                      imageSize={config.imageSize}
                    />
                  </div>
                )}
                <span
                  className={cn(
                    "flex-1 text-sm font-medium",
                    flex.textOrder,
                    config.direction === "vertical" && "text-center",
                  )}
                >
                  {highlightVariables ? (
                    <VariableHighlightedText text={option.label} />
                  ) : (
                    option.label
                  )}
                </span>
              </div>

              {selected && config.detail === "confirmation" && (
                <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-white/20">
                  <Check className="size-3" />
                </span>
              )}
            </>
          );

          if (readOnly) {
            return (
              <div key={option.id} className={cardClassName} style={cardStyle}>
                {cardContent}
              </div>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={cardClassName}
              style={cardStyle}
            >
              {cardContent}
            </button>
          );
        })}
      </div>

      {highlightVariables && config.variableKey ? (
        <p className="text-xs text-slate-500">
          Salva em <VariableHighlightChip name={config.variableKey} />
        </p>
      ) : null}

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
