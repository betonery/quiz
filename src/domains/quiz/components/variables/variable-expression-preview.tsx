"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  evaluateVariableExpressionDetailed,
  interpolateExpression,
} from "@/domains/quiz/utils/variable-expression.utils";
import { extractVariableKeys } from "@/domains/quiz/utils/variable-template.utils";
import type { QuizVariable } from "@/domains/quiz/types/builder.types";

type VariableExpressionPreviewProps = {
  expression: string;
  variables: QuizVariable[];
};

function formatPreviewValue(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function VariableExpressionPreview({
  expression,
  variables,
}: VariableExpressionPreviewProps) {
  const referencedKeys = useMemo(
    () => extractVariableKeys(expression),
    [expression],
  );

  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  const previewVariables = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const key of referencedKeys) {
      const raw = sampleValues[key] ?? "";
      if (raw.trim() === "") {
        const registryItem = variables.find((item) => item.key === key);
        map[key] = registryItem?.label ?? "";
        continue;
      }
      const asNumber = Number(raw);
      map[key] = Number.isFinite(asNumber) ? asNumber : raw;
    }
    return map;
  }, [referencedKeys, sampleValues, variables]);

  const result = evaluateVariableExpressionDetailed(
    expression,
    previewVariables,
  );
  const interpolated = interpolateExpression(expression, previewVariables);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold text-foreground">Preview</p>

      {referencedKeys.length > 0 ? (
        <div className="space-y-2">
          {referencedKeys.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <label className="w-24 shrink-0 text-xs text-muted-foreground">
                {key}
              </label>
              <Input
                value={sampleValues[key] ?? ""}
                placeholder="valor de teste"
                onChange={(e) =>
                  setSampleValues((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
                className="h-8 bg-background text-xs shadow-sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Informe variáveis com {"{{chave}}"} para simular valores.
        </p>
      )}

      <div className="space-y-1 text-xs">
        <p className="text-muted-foreground">
          Interpolado:{" "}
          <span className="font-mono text-foreground">
            {interpolated || "—"}
          </span>
        </p>
        <p className="text-muted-foreground">
          Resultado:{" "}
          <span className="font-mono font-medium text-foreground">
            {result.ok ? formatPreviewValue(result.value) : result.error}
          </span>
        </p>
      </div>
    </div>
  );
}
