"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  formatHexDisplay,
  normalizeHexColor,
  toColorInputValue,
} from "@/domains/quiz/utils/color.utils";
import { cn } from "@/lib/utils";

const hexInputLightClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

const hexInputDarkClass =
  "h-9 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-100 shadow-none outline-none transition-colors focus-visible:border-cyan-500/50 focus-visible:ring-2 focus-visible:ring-cyan-500/20";

type ColorPickerCoreProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant?: "light" | "dark";
  layout?: "stacked" | "inline" | "compact";
  swatchHeight?: "sm" | "md";
  showLabel?: boolean;
  overlay?: ReactNode;
  swatchOverlay?: ReactNode;
};

function useHexDraft(value: string, onChange: (value: string) => void) {
  const [draftHex, setDraftHex] = useState(() => formatHexDisplay(value));

  useEffect(() => {
    setDraftHex(formatHexDisplay(value));
  }, [value]);

  function handlePickerChange(next: string) {
    const normalized = normalizeHexColor(next) ?? next.toLowerCase();
    setDraftHex(formatHexDisplay(normalized));
    onChange(normalized);
  }

  function handleHexChange(next: string) {
    setDraftHex(next);
  }

  function commitHex() {
    const normalized = normalizeHexColor(draftHex);
    if (normalized) {
      setDraftHex(normalized);
      onChange(normalized);
      return;
    }

    setDraftHex(formatHexDisplay(value));
  }

  function handleHexKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitHex();
      event.currentTarget.blur();
    }
  }

  return {
    draftHex,
    pickerValue: toColorInputValue(value),
    swatchColor: toColorInputValue(value),
    handlePickerChange,
    handleHexChange,
    commitHex,
    handleHexKeyDown,
  };
}

function ColorSwatch({
  label,
  color,
  pickerValue,
  onPickerChange,
  height,
  isDark,
  overlay,
}: {
  label: string;
  color: string;
  pickerValue: string;
  onPickerChange: (value: string) => void;
  height: "sm" | "md";
  isDark: boolean;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative shrink-0">
      <label className="relative block">
        <span
          className={cn(
            "block w-full rounded-lg border shadow-sm",
            height === "sm" ? "h-10" : "h-12",
            isDark ? "border-slate-700" : "border-border",
          )}
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onPickerChange(event.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </label>
      {overlay}
    </div>
  );
}

function HexInput({
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  variant,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  variant: "light" | "dark";
  className?: string;
}) {
  const isDark = variant === "dark";

  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="#000000"
      spellCheck={false}
      aria-label={`${label} (hexadecimal)`}
      className={cn(
        "font-mono text-xs uppercase shadow-sm",
        isDark ? hexInputDarkClass : hexInputLightClass,
        className,
      )}
    />
  );
}

export function ColorPickerCore({
  value,
  onChange,
  label,
  variant = "light",
  layout = "stacked",
  swatchHeight = "md",
  showLabel = true,
  overlay,
  swatchOverlay,
}: ColorPickerCoreProps) {
  const isDark = variant === "dark";
  const {
    draftHex,
    pickerValue,
    swatchColor,
    handlePickerChange,
    handleHexChange,
    commitHex,
    handleHexKeyDown,
  } = useHexDraft(value, onChange);

  if (layout === "compact") {
    return (
      <div className="flex items-center gap-1">
        <div className="relative shrink-0">
          <label className="relative block">
            <span
              className="block size-8 rounded-md border border-border bg-background"
              style={{ backgroundColor: swatchColor }}
            />
            <input
              type="color"
              value={pickerValue}
              onChange={(event) => handlePickerChange(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              aria-label={label}
            />
          </label>
          {overlay}
        </div>
        <HexInput
          label={label}
          value={draftHex}
          onChange={handleHexChange}
          onBlur={commitHex}
          onKeyDown={handleHexKeyDown}
          variant={variant}
          className="h-8 w-[72px] px-2 text-[10px]"
        />
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div className="flex gap-2">
        <label className="relative shrink-0">
          <span
            className={cn(
              "block size-9 rounded-lg border shadow-sm",
              isDark ? "border-slate-700" : "border-border",
            )}
            style={{ backgroundColor: swatchColor }}
          />
          <input
            type="color"
            value={pickerValue}
            onChange={(event) => handlePickerChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <HexInput
          label={label}
          value={draftHex}
          onChange={handleHexChange}
          onBlur={commitHex}
          onKeyDown={handleHexKeyDown}
          variant={variant}
          className="min-w-0 flex-1"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel ? (
        <span
          className={cn(
            "text-xs font-medium",
            isDark ? "text-slate-300" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      ) : null}
      <ColorSwatch
        label={label}
        color={swatchColor}
        pickerValue={pickerValue}
        onPickerChange={handlePickerChange}
        height={swatchHeight}
        isDark={isDark}
        overlay={swatchOverlay}
      />
      <HexInput
        label={label}
        value={draftHex}
        onChange={handleHexChange}
        onBlur={commitHex}
        onKeyDown={handleHexKeyDown}
        variant={variant}
      />
    </div>
  );
}
