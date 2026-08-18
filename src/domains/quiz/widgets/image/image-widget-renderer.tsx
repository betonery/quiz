"use client";

import { ImageIcon } from "lucide-react";
import type { ImageWidgetConfig } from "@/domains/quiz/types/builder.types";
import { getMediaImageSrc } from "@/domains/quiz/utils/media-source.utils";
import {
  getMediaBorderRadiusClass,
  getMediaWidthClass,
} from "@/domains/quiz/utils/media-widget-styles.utils";
import { cn } from "@/lib/utils";

type ImageWidgetRendererProps = {
  config: ImageWidgetConfig;
  className?: string;
  // Imagens acima da dobra (primeira etapa) devem carregar com prioridade para
  // não atrasar o LCP. Demais imagens permanecem lazy.
  priority?: boolean;
};

export function ImageWidgetRenderer({
  config,
  className,
  priority = false,
}: ImageWidgetRendererProps) {
  const src = getMediaImageSrc(config.source);
  const widthClass = getMediaWidthClass(config.width);
  const radiusClass = getMediaBorderRadiusClass(config.borderRadius);

  if (!src) {
    return (
      <div
        className={cn(
          "mx-auto flex aspect-video items-center justify-center border border-dashed border-muted-foreground/30 bg-muted/30",
          widthClass,
          radiusClass,
          className,
        )}
      >
        <ImageIcon className="size-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn(
        "mx-auto block h-auto object-cover",
        widthClass,
        radiusClass,
        className,
      )}
    />
  );
}
