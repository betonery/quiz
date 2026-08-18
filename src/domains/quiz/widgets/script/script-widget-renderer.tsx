"use client";

import { useEffect } from "react";
import type { ScriptWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  getScriptPreviewLines,
  injectScriptSnippets,
  parseScriptEmbedCode,
} from "@/domains/quiz/utils/script-widget.utils";
import { cn } from "@/lib/utils";

type ScriptWidgetRendererProps = {
  config: ScriptWidgetConfig;
  mode?: "edit" | "preview" | "player";
  widgetId?: string;
  className?: string;
};

function ScriptCodePreview({ code }: { code: string }) {
  const preview = getScriptPreviewLines(code);

  return (
    <pre className="overflow-hidden whitespace-pre-wrap break-all text-[13px] leading-relaxed text-neutral-100">
      {preview.split(/(<[^>]+>|"[^"]*"|'[^']*')/g).map((part, index) => {
        if (part.startsWith("<") || part.startsWith("</")) {
          return (
            <span key={index} className="text-emerald-400">
              {part}
            </span>
          );
        }
        if (
          (part.startsWith('"') && part.endsWith('"')) ||
          (part.startsWith("'") && part.endsWith("'"))
        ) {
          return (
            <span key={index} className="text-amber-300">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </pre>
  );
}

export function ScriptWidgetRenderer({
  config,
  mode = "edit",
  widgetId,
  className,
}: ScriptWidgetRendererProps) {
  const dedupeKey = config.componentId ?? widgetId ?? "unknown";

  useEffect(() => {
    if (mode !== "player") return;

    const snippets = parseScriptEmbedCode(config.embedCode);
    injectScriptSnippets(snippets, dedupeKey);
  }, [config.embedCode, dedupeKey, mode]);

  if (mode === "player") {
    return null;
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl bg-neutral-900 px-4 py-3",
        className,
      )}
    >
      <ScriptCodePreview code={config.embedCode} />
      <span className="absolute right-2 bottom-2 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-900">
        Invisível
      </span>
    </div>
  );
}
