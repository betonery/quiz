"use client";

import type { SpacerWidgetConfig } from "@/domains/quiz/types/builder.types";
import { resolveSpacerBackgroundColor } from "@/domains/quiz/utils/spacer-widget.utils";
import { cn } from "@/lib/utils";

type SpacerWidgetRendererProps = {
  config: SpacerWidgetConfig;
  mode?: "edit" | "preview" | "player";
  className?: string;
};

export function SpacerWidgetRenderer({
  config,
  mode = "edit",
  className,
}: SpacerWidgetRendererProps) {
  const backgroundColor = resolveSpacerBackgroundColor(config);
  const isTransparent = backgroundColor === "transparent";

  return (
    <div
      aria-hidden
      style={{
        height: config.heightPx,
        backgroundColor: isTransparent ? undefined : backgroundColor,
      }}
      className={cn(
        "w-full shrink-0",
        mode === "edit" &&
          isTransparent &&
          "border border-dashed border-slate-300/60",
        className,
      )}
    />
  );
}
