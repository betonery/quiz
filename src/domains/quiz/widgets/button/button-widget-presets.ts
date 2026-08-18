import type {
  ButtonVariant,
  ButtonWidgetConfig,
} from "@/domains/quiz/types/builder.types";

export type ButtonStylePreset = Pick<
  ButtonWidgetConfig,
  "backgroundColor" | "textColor" | "borderColor"
>;

export const BUTTON_STYLE_PRESETS: Record<
  Exclude<ButtonVariant, "custom">,
  { label: string; colors: ButtonStylePreset }
> = {
  solid: {
    label: "Sólido",
    colors: {
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
      borderColor: "#0f172a",
    },
  },
  outline: {
    label: "Contorno",
    colors: {
      backgroundColor: "transparent",
      textColor: "#0f172a",
      borderColor: "#0f172a",
    },
  },
  ghost: {
    label: "Discreto",
    colors: {
      backgroundColor: "transparent",
      textColor: "#0f172a",
      borderColor: "transparent",
    },
  },
  soft: {
    label: "Suave",
    colors: {
      backgroundColor: "#eff6ff",
      textColor: "#1d4ed8",
      borderColor: "#bfdbfe",
    },
  },
  critical: {
    label: "Crítico",
    colors: {
      backgroundColor: "#dc2626",
      textColor: "#ffffff",
      borderColor: "#dc2626",
    },
  },
};

function normalizeColor(value: string): string {
  return value.trim().toLowerCase();
}

export function detectButtonVariant(config: ButtonWidgetConfig): ButtonVariant {
  const bg = normalizeColor(config.backgroundColor);
  const text = normalizeColor(config.textColor);
  const border = normalizeColor(config.borderColor);

  for (const [variant, preset] of Object.entries(BUTTON_STYLE_PRESETS) as [
    Exclude<ButtonVariant, "custom">,
    (typeof BUTTON_STYLE_PRESETS)[Exclude<ButtonVariant, "custom">],
  ][]) {
    const { colors } = preset;
    if (
      normalizeColor(colors.backgroundColor) === bg &&
      normalizeColor(colors.textColor) === text &&
      normalizeColor(colors.borderColor) === border
    ) {
      return variant;
    }
  }

  return "custom";
}

export function applyButtonVariant(
  config: ButtonWidgetConfig,
  variant: Exclude<ButtonVariant, "custom">,
): ButtonWidgetConfig {
  return {
    ...config,
    variant,
    ...BUTTON_STYLE_PRESETS[variant].colors,
  };
}
