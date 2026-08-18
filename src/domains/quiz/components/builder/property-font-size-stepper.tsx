"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PropertyNumericStepperProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  className?: string;
  decreaseAriaLabel?: string;
  increaseAriaLabel?: string;
};

export function PropertyNumericStepper({
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = "px",
  onChange,
  className,
  decreaseAriaLabel = "Diminuir valor",
  increaseAriaLabel = "Aumentar valor",
}: PropertyNumericStepperProps) {
  function clamp(next: number) {
    return Math.min(max, Math.max(min, next));
  }

  function roundToStep(next: number) {
    const precision = step.toString().includes(".")
      ? (step.toString().split(".")[1]?.length ?? 1)
      : 0;
    return Number(next.toFixed(precision));
  }

  function handleInputChange(raw: string) {
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return;
    onChange(roundToStep(clamp(parsed)));
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(roundToStep(clamp(value - step)))}
        disabled={value <= min}
        aria-label={decreaseAriaLabel}
      >
        <Minus className="size-4" />
      </Button>

      <div className="relative min-w-0 flex-1">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => handleInputChange(event.target.value)}
          className="bg-background pr-8 text-center shadow-sm tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          {unit}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(roundToStep(clamp(value + step)))}
        disabled={value >= max}
        aria-label={increaseAriaLabel}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

export function PropertyFontSizeStepper(
  props: Omit<PropertyNumericStepperProps, "min" | "max" | "unit"> &
    Partial<Pick<PropertyNumericStepperProps, "min" | "max" | "unit">>,
) {
  return (
    <PropertyNumericStepper
      min={12}
      max={72}
      unit="px"
      decreaseAriaLabel="Diminuir tamanho da fonte"
      increaseAriaLabel="Aumentar tamanho da fonte"
      {...props}
    />
  );
}
