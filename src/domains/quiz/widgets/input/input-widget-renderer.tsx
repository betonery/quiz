"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  VariableHighlightChip,
  VariableHighlightedText,
} from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  applyPhoneInput,
  INPUT_NUMBER_MAX_LENGTH,
  INPUT_TEXT_MAX_LENGTH,
} from "@/domains/quiz/utils/input-phone-mask.utils";
import {
  getInputAlignClass,
  getInputFontSizeClass,
  getInputPaddingClass,
  resolveInputColors,
} from "@/domains/quiz/utils/input-widget-styles.utils";
import { cn } from "@/lib/utils";

type InputWidgetRendererProps = {
  config: InputWidgetConfig;
  design: QuizDesignSettings;
  value?: string;
  onChange?: (value: string) => void;
  error?: string | null;
  readOnly?: boolean;
  highlightVariables?: boolean;
};

export function InputWidgetRenderer({
  config,
  design,
  value = "",
  onChange,
  error,
  readOnly = false,
  highlightVariables = false,
}: InputWidgetRendererProps) {
  const [showPassword, setShowPassword] = useState(false);
  const colors = resolveInputColors(config, design);

  const displayValue =
    config.inputType === "phone" && !readOnly
      ? applyPhoneInput(value).display
      : value;

  function handleChange(raw: string) {
    if (!onChange || readOnly) return;

    switch (config.inputType) {
      case "phone":
        onChange(applyPhoneInput(raw).value);
        break;
      case "number":
        onChange(raw.replace(/\D/g, "").slice(0, INPUT_NUMBER_MAX_LENGTH));
        break;
      case "text":
        onChange(raw.slice(0, INPUT_TEXT_MAX_LENGTH));
        break;
      default:
        onChange(raw);
    }
  }

  const inputType =
    config.inputType === "password"
      ? showPassword
        ? "text"
        : "password"
      : config.inputType === "phone"
        ? "tel"
        : config.inputType === "number"
          ? "text"
          : config.inputType;

  const inputClassName = cn(
    "w-full rounded-lg border outline-none transition-colors",
    getInputPaddingClass(config.paddingSize),
    getInputFontSizeClass(config.fontSize),
    getInputAlignClass(config.placeholderAlign),
    error && "border-destructive",
    readOnly && "pointer-events-none",
  );

  const inputStyle = {
    backgroundColor: colors.backgroundColor,
    borderColor: error ? "hsl(var(--destructive))" : colors.borderColor,
    color: design.colors.titles,
    ["--placeholder-color" as string]: colors.placeholderColor,
  };

  const placeholder = config.placeholder || "Digite aqui...";

  function renderHighlightedText(text: string, extraClassName?: string) {
    if (highlightVariables) {
      return <VariableHighlightedText text={text} className={extraClassName} />;
    }
    return text;
  }

  return (
    <div className="w-full space-y-2">
      {config.showLabel && (
        <label
          className="block text-sm font-semibold"
          style={{
            color: design.colors.titles,
            fontFamily: "var(--quiz-font-title)",
          }}
        >
          {renderHighlightedText(config.label)}
          {config.required && (
            <span className="ml-0.5 text-destructive">*</span>
          )}
        </label>
      )}

      {highlightVariables && config.variableKey ? (
        <p className="text-xs text-slate-500">
          Salva em <VariableHighlightChip name={config.variableKey} />
        </p>
      ) : null}

      <div className="relative">
        {readOnly ? (
          <div
            className={cn(inputClassName, "text-muted-foreground")}
            style={{
              ...inputStyle,
              color: colors.placeholderColor,
            }}
          >
            {renderHighlightedText(placeholder)}
          </div>
        ) : (
          <input
            type={inputType}
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            inputMode={config.inputType === "number" ? "numeric" : undefined}
            maxLength={
              config.inputType === "text"
                ? INPUT_TEXT_MAX_LENGTH
                : config.inputType === "number"
                  ? INPUT_NUMBER_MAX_LENGTH
                  : undefined
            }
            className={cn(
              inputClassName,
              "placeholder:text-[var(--placeholder-color)]",
              config.inputType === "password" && "pr-10",
            )}
            style={inputStyle}
            aria-invalid={Boolean(error)}
          />
        )}

        {!readOnly && config.inputType === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
