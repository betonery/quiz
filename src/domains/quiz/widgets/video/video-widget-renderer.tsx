"use client";

import type { VideoWidgetConfig } from "@/domains/quiz/types/builder.types";
import { getVideoEmbedFromConfig } from "@/domains/quiz/utils/video-embed.utils";
import { cn } from "@/lib/utils";

type VideoWidgetRendererProps = {
  config: VideoWidgetConfig;
  className?: string;
};

export function VideoWidgetRenderer({
  config,
  className,
}: VideoWidgetRendererProps) {
  const parsed = getVideoEmbedFromConfig(config.embedCode);

  if (!parsed) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Adicione um vídeo válido (YouTube, Vimeo, Loom, Panda Video ou qualquer
        outro iframe)
      </div>
    );
  }

  const aspectClass =
    config.aspect === "vertical"
      ? "aspect-[9/16] max-h-[70vh] w-full max-w-sm"
      : "aspect-video w-full";

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-xl bg-black",
        aspectClass,
        className,
      )}
    >
      {/*
        `allow-fullscreen` não existe como token de sandbox: o fullscreen vem do
        atributo allowFullScreen somado a `allow-presentation`. Players de
        terceiros (Panda, Vturb) abrem janelas de compartilhamento, daí os
        tokens de popup.
      */}
      <iframe
        src={parsed.src}
        title="Vídeo incorporado"
        className="size-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
