import type {
  MediaBorderRadius,
  MediaWidth,
} from "@/domains/quiz/types/media.types";

const MEDIA_WIDTH_CLASSES: Record<MediaWidth, string> = {
  full: "w-full",
  sm: "w-full max-w-xs",
  md: "w-full max-w-md",
  lg: "w-full max-w-lg",
  xl: "w-full max-w-2xl",
};

const MEDIA_BORDER_RADIUS_CLASSES: Record<MediaBorderRadius, string> = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
};

export function getMediaWidthClass(width: MediaWidth): string {
  return MEDIA_WIDTH_CLASSES[width];
}

export function getMediaBorderRadiusClass(radius: MediaBorderRadius): string {
  return MEDIA_BORDER_RADIUS_CLASSES[radius];
}

export const MEDIA_WIDTH_LABELS: Record<MediaWidth, string> = {
  full: "Total",
  sm: "Pequena",
  md: "Média",
  lg: "Grande",
  xl: "Gigante",
};

export const MEDIA_BORDER_RADIUS_LABELS: Record<MediaBorderRadius, string> = {
  sm: "Pequena",
  md: "Média",
  lg: "Grande",
  xl: "Extra",
};
