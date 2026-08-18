import type {
  ChartColor,
  ChartItem,
  ChartsLayout,
} from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  renderRichTextHtml,
  richContentToPlainText,
} from "@/domains/quiz/utils/text-rich-content.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export const CHART_TRACK_COLOR = "#e5e7eb";

const CHART_COLOR_MAP: Record<Exclude<ChartColor, "theme">, string> = {
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#eab308",
  orange: "#f97316",
  black: "#0f172a",
};

export function clampChartValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function resolveChartColor(
  color: ChartColor,
  design: QuizDesignSettings,
): string {
  if (color === "theme") return design.colors.primary;
  return CHART_COLOR_MAP[color];
}

export function getChartsGridClass(layout: ChartsLayout): string {
  switch (layout) {
    case "list":
      return "grid-cols-1";
    case "cols2":
      return "grid-cols-1 sm:grid-cols-2";
    case "cols3":
      return "grid-cols-1 sm:grid-cols-3";
    case "cols4":
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    default:
      return "grid-cols-1";
  }
}

export function resolveChartLegendPlain(
  item: ChartItem,
  variables: Record<string, unknown> = {},
): string {
  if (item.legendContentMode === "rich" && item.legendRichContent) {
    return richContentToPlainText(item.legendRichContent);
  }
  return resolveTemplate(item.legend, variables);
}

export function resolveChartLegendHtml(
  item: ChartItem,
  variables: Record<string, unknown> = {},
): string | null {
  if (item.legendContentMode === "rich" && item.legendRichContent) {
    return renderRichTextHtml(item.legendRichContent, variables);
  }
  return null;
}

export const CHART_COLOR_LABELS: Record<ChartColor, string> = {
  theme: "Tema",
  red: "Vermelho",
  green: "Verde",
  blue: "Azul",
  yellow: "Amarelo",
  orange: "Laranja",
  black: "Preto",
};

export const CHART_TYPE_LABELS: Record<ChartItem["chartType"], string> = {
  bar: "Barra",
  circular: "Circular",
};
