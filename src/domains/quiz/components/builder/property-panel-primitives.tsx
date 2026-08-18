"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ColorPickerCore } from "@/domains/quiz/components/builder/color-picker-core";
import { cn } from "@/lib/utils";

export const propertyFieldClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

export const propertyFieldDarkClass =
  "h-9 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-100 shadow-none outline-none transition-colors focus-visible:border-cyan-500/50 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

export const propertyTextareaClass =
  "min-h-[96px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

type PropertiesSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
};

export function PropertiesSection({
  title,
  children,
  className,
  variant = "light",
}: PropertiesSectionProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "rounded-xl border p-4",
        isDark
          ? "border-slate-700/60 bg-slate-900/40 shadow-none"
          : "border-border bg-background shadow-sm",
        className,
      )}
    >
      <h3
        className={cn(
          "mb-4 text-xs font-semibold tracking-wide uppercase",
          isDark ? "text-slate-400" : "text-muted-foreground",
        )}
      >
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

type PropertyFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
};

export function PropertyField({
  label,
  children,
  className,
  variant = "light",
}: PropertyFieldProps) {
  const isDark = variant === "dark";

  return (
    <div className={cn("space-y-2", className)}>
      <label
        className={cn(
          "text-sm font-semibold",
          isDark ? "text-slate-200" : "text-foreground",
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

type PropertySelectProps = {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: "light" | "dark";
};

export function PropertySelect({
  value,
  onChange,
  disabled,
  children,
  variant = "light",
}: PropertySelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        variant === "dark" ? propertyFieldDarkClass : propertyFieldClass,
        disabled && "opacity-80",
      )}
    >
      {children}
    </select>
  );
}

type PropertyTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
};

export function PropertyTextarea({
  value,
  onChange,
  rows = 4,
}: PropertyTextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={propertyTextareaClass}
    />
  );
}

type PropertyColorSwatchProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant?: "light" | "dark";
};

export function PropertyColorSwatch({
  label,
  value,
  onChange,
  variant = "light",
}: PropertyColorSwatchProps) {
  return (
    <ColorPickerCore
      label={label}
      value={value}
      onChange={onChange}
      variant={variant}
      layout="stacked"
      swatchHeight="md"
    />
  );
}

type PropertyColorSwatchResetProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
};

export function PropertyColorSwatchReset({
  label,
  value,
  onChange,
  onReset,
}: PropertyColorSwatchResetProps) {
  return (
    <ColorPickerCore
      label={label}
      value={value}
      onChange={onChange}
      layout="stacked"
      swatchHeight="sm"
      swatchOverlay={
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onReset();
          }}
          className="absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90"
          aria-label={`Resetar ${label}`}
        >
          <X className="size-3" />
        </button>
      }
    />
  );
}

type PropertyColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function PropertyColorField({
  label,
  value,
  onChange,
}: PropertyColorFieldProps) {
  return (
    <PropertyField label={label}>
      <ColorPickerCore
        label={label}
        value={value}
        onChange={onChange}
        layout="inline"
        showLabel={false}
      />
    </PropertyField>
  );
}

type PropertyCheckboxProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

type PropertyRangeProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
  variant?: "light" | "dark";
};

export function PropertyRange({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue = (v) => String(v),
  onChange,
  variant = "light",
}: PropertyRangeProps) {
  const isDark = variant === "dark";

  return (
    <PropertyField label={label} variant={variant}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border px-3 py-2",
          isDark
            ? "border-slate-700 bg-slate-900/60 shadow-none"
            : "border-border bg-background shadow-sm",
        )}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-2 min-w-0 flex-1 cursor-pointer accent-cyan-500"
        />
        <span
          className={cn(
            "w-10 shrink-0 text-right text-sm font-medium",
            isDark ? "text-slate-400" : "text-muted-foreground",
          )}
        >
          {formatValue(value)}
        </span>
      </div>
    </PropertyField>
  );
}

export function PropertyCheckbox({
  label,
  checked,
  disabled = false,
  onChange,
}: PropertyCheckboxProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border text-primary focus:ring-ring/30 disabled:cursor-not-allowed"
      />
    </label>
  );
}
