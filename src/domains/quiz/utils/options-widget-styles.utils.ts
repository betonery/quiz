import type {
  OptionItem,
  OptionsWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";

export const OPTIONS_DEFAULT_BORDER_COLOR = "#e2e8f0";

export type ResolvedOptionsColors = {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  selectedBackgroundColor: string;
  selectedBorderColor: string;
  selectedTextColor: string;
};

export function resolveOptionsColors(
  config: OptionsWidgetConfig,
  design: QuizDesignSettings,
): ResolvedOptionsColors {
  return {
    backgroundColor: config.backgroundColor ?? design.colors.background,
    textColor: config.textColor ?? design.colors.titles,
    borderColor: config.borderColor ?? OPTIONS_DEFAULT_BORDER_COLOR,
    selectedBackgroundColor:
      config.selectedBackgroundColor ?? design.colors.primary,
    selectedBorderColor: config.selectedBorderColor ?? design.colors.primary,
    selectedTextColor: config.selectedTextColor ?? "#ffffff",
  };
}

const gridClassMap = {
  list: "grid-cols-1",
  cols2: "grid-cols-2",
  cols3: "grid-cols-3",
  cols4: "grid-cols-4",
} as const;

export function getOptionsGridClass(
  layout: OptionsWidgetConfig["layout"],
): string {
  return gridClassMap[layout];
}

const gapClassMap = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
} as const;

export function getOptionsGapClass(
  spacing: OptionsWidgetConfig["spacing"],
): string {
  return gapClassMap[spacing];
}

const radiusClassMap = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
} as const;

export function getOptionsRadiusClass(
  borderRadius: OptionsWidgetConfig["borderRadius"],
): string {
  return radiusClassMap[borderRadius];
}

const shadowClassMap = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
} as const;

export function getOptionsShadowClass(
  shadow: OptionsWidgetConfig["shadow"],
): string {
  return shadowClassMap[shadow];
}

export function getOptionCardClass(
  variant: OptionsWidgetConfig["variant"],
): string {
  return variant === "outlined" ? "border-2 bg-transparent" : "border";
}

export function getOptionFlexClasses(
  direction: OptionsWidgetConfig["direction"],
  disposition: OptionsWidgetConfig["disposition"],
): { container: string; imageOrder: string; textOrder: string } {
  const isHorizontal = direction === "horizontal";
  const container = isHorizontal
    ? "flex flex-row items-center"
    : "flex flex-col items-center";

  if (disposition === "text_only") {
    return {
      container: "flex items-center justify-center",
      imageOrder: "hidden",
      textOrder: "",
    };
  }

  const imageFirst = disposition === "image_text";
  return {
    container: `${container} gap-2`,
    imageOrder: imageFirst
      ? isHorizontal
        ? "order-1"
        : "order-1"
      : isHorizontal
        ? "order-2"
        : "order-2",
    textOrder: imageFirst
      ? isHorizontal
        ? "order-2"
        : "order-2"
      : isHorizontal
        ? "order-1"
        : "order-1",
  };
}

export function getOptionImageSrc(option: OptionItem): string | null {
  if (option.imageType === "emoji" && option.emoji) return null;
  if (option.imageType === "url" && option.url) return option.url;
  if (option.imageType === "file" && option.filePath) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/quiz-assets/${option.filePath}`;
  }
  return null;
}

const imageSizeClassMap = {
  sm: { box: "size-8", emoji: "text-lg" },
  md: { box: "size-10", emoji: "text-xl" },
  lg: { box: "size-14", emoji: "text-3xl" },
  xl: { box: "size-20", emoji: "text-5xl" },
} as const;

export function getOptionImageSizeClasses(
  imageSize: OptionsWidgetConfig["imageSize"],
): { box: string; emoji: string } {
  return imageSizeClassMap[imageSize];
}
