"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  extractVariableKeys,
  resolveLinkUrl,
} from "@/domains/quiz/utils/variable-template.utils";
import type { QuizVariable } from "@/domains/quiz/types/builder.types";

type LinkUrlPreviewProps = {
  url: string;
  variables: QuizVariable[];
};

export function LinkUrlPreview({ url, variables }: LinkUrlPreviewProps) {
  const referencedKeys = useMemo(() => extractVariableKeys(url), [url]);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  const previewVariables = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const key of referencedKeys) {
      const raw = sampleValues[key] ?? "";
      if (raw.trim() === "") {
        const registryItem = variables.find((item) => item.key === key);
        map[key] = registryItem?.label ?? key;
        continue;
      }
      map[key] = raw;
    }
    return map;
  }, [referencedKeys, sampleValues, variables]);

  const resolvedUrl = resolveLinkUrl(url, previewVariables);

  if (!referencedKeys.length) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-semibold text-foreground">Preview da URL</p>

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

      <p className="text-xs text-muted-foreground">
        URL final:{" "}
        <span className="break-all font-mono text-foreground">
          {resolvedUrl || "—"}
        </span>
      </p>
    </div>
  );
}
