"use client";

import type { EmbedWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  EMBED_SUPPORTED_PROVIDERS_HINT,
  getEmbedAspectRatioStyle,
  getEmbedSandboxAttrs,
  parseEmbedInput,
} from "@/domains/quiz/utils/embed-widget.utils";
import { cn } from "@/lib/utils";

type EmbedWidgetRendererProps = {
  config: EmbedWidgetConfig;
  mode?: "edit" | "preview" | "player";
  className?: string;
};

export function EmbedWidgetRenderer({
  config,
  mode = "edit",
  className,
}: EmbedWidgetRendererProps) {
  const parsed = parseEmbedInput(config.embedInput);
  const aspectStyle = getEmbedAspectRatioStyle(
    config.aspectRatio,
    config.customHeightPx,
  );

  if (!parsed) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground",
          className,
        )}
        style={aspectStyle}
      >
        {mode === "player"
          ? "Conteúdo incorporado indisponível"
          : `Cole uma URL ou iframe de um provider suportado (${EMBED_SUPPORTED_PROVIDERS_HINT})`}
      </div>
    );
  }

  return (
    <div
      className={cn("w-full overflow-hidden rounded-xl bg-muted/20", className)}
      style={aspectStyle}
    >
      <iframe
        src={parsed.src}
        title={config.title ?? "Conteúdo incorporado"}
        className="size-full border-0"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox={getEmbedSandboxAttrs(config.allowFullscreen)}
        allow={
          config.allowFullscreen
            ? "fullscreen; clipboard-write; encrypted-media"
            : "clipboard-write; encrypted-media"
        }
        allowFullScreen={config.allowFullscreen}
      />
    </div>
  );
}
