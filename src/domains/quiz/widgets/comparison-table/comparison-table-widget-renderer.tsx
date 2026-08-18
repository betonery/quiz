"use client";

import { Check, X } from "lucide-react";
import type { ComparisonTableWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  getHighlightedColumnIndex,
  resolveComparisonCellText,
  resolveComparisonField,
  resolveComparisonTableColors,
} from "@/domains/quiz/utils/comparison-table-widget.utils";
import { cn } from "@/lib/utils";

type ComparisonTableWidgetRendererProps = {
  config: ComparisonTableWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

function CellContent({
  cell,
  colors,
  variables,
  highlightVariables,
}: {
  cell: ComparisonTableWidgetConfig["rows"][number]["cells"][number];
  colors: ReturnType<typeof resolveComparisonTableColors>;
  variables?: Record<string, unknown>;
  highlightVariables: boolean;
}) {
  if (cell.type === "check") {
    return <Check className="mx-auto size-4" style={{ color: colors.check }} />;
  }
  if (cell.type === "x") {
    return <X className="mx-auto size-4" style={{ color: colors.x }} />;
  }

  const text = resolveComparisonCellText(cell, variables);
  if (highlightVariables && cell.text) {
    return (
      <span className="text-sm [font-family:var(--quiz-font-body)]">
        <VariableHighlightedText text={cell.text} />
      </span>
    );
  }

  return (
    <span
      className="text-sm [font-family:var(--quiz-font-body)]"
      style={{ color: colors.text }}
    >
      {text}
    </span>
  );
}

function getHighlightShadow(
  colors: ReturnType<typeof resolveComparisonTableColors>,
  position: "header" | "middle" | "footer",
): string {
  const horizontal = `inset 2px 0 0 0 ${colors.highlightBorder}, inset -2px 0 0 0 ${colors.highlightBorder}`;
  if (position === "header") {
    return `${horizontal}, inset 0 2px 0 0 ${colors.highlightBorder}`;
  }
  if (position === "footer") {
    return `${horizontal}, inset 0 -2px 0 0 ${colors.highlightBorder}`;
  }
  return horizontal;
}

export function ComparisonTableWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: ComparisonTableWidgetRendererProps) {
  const colors = resolveComparisonTableColors(config, design);
  const highlightIndex = getHighlightedColumnIndex(config.columns);
  const lastRowIndex = config.rows.length - 1;

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: colors.border }}
      >
        <table className="w-full min-w-[320px] border-separate border-spacing-0">
          <thead>
            <tr>
              {config.showRowLabels ? (
                <th
                  className="border-b border-r px-3 py-3 text-left text-sm font-semibold"
                  style={{
                    color: colors.header,
                    borderColor: colors.border,
                  }}
                >
                  {config.cornerLabel ? (
                    highlightVariables ? (
                      <VariableHighlightedText text={config.cornerLabel} />
                    ) : (
                      resolveComparisonField(config.cornerLabel, variables)
                    )
                  ) : null}
                </th>
              ) : null}
              {config.columns.map((column, columnIndex) => {
                const highlighted = columnIndex === highlightIndex;
                return (
                  <th
                    key={column.id}
                    className={cn(
                      "border-b px-3 py-3 text-center text-sm font-semibold",
                      columnIndex < config.columns.length - 1 && "border-r",
                    )}
                    style={{
                      color: colors.header,
                      backgroundColor: highlighted
                        ? colors.highlightColumn
                        : undefined,
                      borderColor: colors.border,
                      boxShadow: highlighted
                        ? getHighlightShadow(colors, "header")
                        : undefined,
                    }}
                  >
                    {highlightVariables ? (
                      <VariableHighlightedText text={column.label} />
                    ) : (
                      resolveComparisonField(column.label, variables)
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {config.rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                className={rowIndex % 2 === 1 ? "bg-black/[0.02]" : undefined}
              >
                {config.showRowLabels ? (
                  <td
                    className={cn(
                      "border-r px-3 py-3 text-left text-sm font-medium",
                      rowIndex < lastRowIndex && "border-b",
                    )}
                    style={{
                      color: colors.rowLabel,
                      borderColor: colors.border,
                    }}
                  >
                    {highlightVariables ? (
                      <VariableHighlightedText text={row.label} />
                    ) : (
                      resolveComparisonField(row.label, variables)
                    )}
                  </td>
                ) : null}
                {row.cells.map((cell, columnIndex) => {
                  const highlighted = columnIndex === highlightIndex;
                  const highlightPosition =
                    rowIndex === lastRowIndex ? "footer" : "middle";

                  return (
                    <td
                      key={`${row.id}-${columnIndex}`}
                      className={cn(
                        "px-3 py-3 text-center",
                        rowIndex < lastRowIndex && "border-b",
                        columnIndex < config.columns.length - 1 && "border-r",
                      )}
                      style={{
                        borderColor: colors.border,
                        backgroundColor: highlighted
                          ? colors.highlightColumn
                          : undefined,
                        boxShadow: highlighted
                          ? getHighlightShadow(colors, highlightPosition)
                          : undefined,
                      }}
                    >
                      <CellContent
                        cell={cell}
                        colors={colors}
                        variables={variables}
                        highlightVariables={highlightVariables}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
