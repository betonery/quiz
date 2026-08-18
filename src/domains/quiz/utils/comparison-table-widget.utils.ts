import type { ComparisonTableWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { ComparisonCell } from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function resolveComparisonCellText(
  cell: ComparisonCell,
  variables?: Record<string, unknown>,
): string {
  if (cell.type !== "text" || !cell.text) return "";
  if (!variables) return cell.text;
  return resolveTemplate(cell.text, variables);
}

export function resolveComparisonField(
  text: string,
  variables?: Record<string, unknown>,
): string {
  if (!variables) return text;
  return resolveTemplate(text, variables);
}

export function resolveComparisonTableColors(
  config: Pick<
    ComparisonTableWidgetConfig,
    | "headerColor"
    | "rowLabelColor"
    | "highlightColumnColor"
    | "checkColor"
    | "xColor"
    | "borderColor"
    | "textColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    header: config.headerColor ?? design.colors.titles,
    rowLabel: config.rowLabelColor ?? design.colors.texts,
    highlightColumn:
      config.highlightColumnColor ?? `${design.colors.primary}14`,
    highlightBorder: design.colors.primary,
    check: config.checkColor ?? "#16a34a",
    x: config.xColor ?? "#ef4444",
    border: config.borderColor ?? `${design.colors.texts}22`,
    text: config.textColor ?? design.colors.texts,
  };
}

export function getHighlightedColumnIndex(
  columns: ComparisonTableWidgetConfig["columns"],
): number {
  const index = columns.findIndex((column) => column.highlighted);
  return index >= 0 ? index : columns.length - 1;
}
