"use client";

import { useCallback, useRef, useState } from "react";
import type { BeforeAfterWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { BeforeAfterSide } from "@/domains/quiz/types/media.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  getBeforeAfterSideImageSrc,
  resolveBeforeAfterColors,
  resolveBeforeAfterField,
  clampSliderPosition,
} from "@/domains/quiz/utils/before-after-widget.utils";
import { getMediaBorderRadiusClass } from "@/domains/quiz/utils/media-widget-styles.utils";
import { cn } from "@/lib/utils";

type BeforeAfterWidgetRendererProps = {
  config: BeforeAfterWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  mode?: "edit" | "preview" | "player";
  className?: string;
};

function SideImage({
  side,
  radiusClass,
}: {
  side: BeforeAfterSide;
  radiusClass: string;
}) {
  const src = getBeforeAfterSideImageSrc(side);

  if (side.imageType === "emoji" && side.emoji) {
    return (
      <div
        className={cn(
          "flex aspect-[4/5] w-full items-center justify-center bg-muted/30 text-6xl",
          radiusClass,
        )}
      >
        {side.emoji}
      </div>
    );
  }

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={side.caption}
        className={cn("aspect-[4/5] w-full object-cover", radiusClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-[4/5] w-full items-center justify-center bg-muted/30 text-sm text-muted-foreground",
        radiusClass,
      )}
    >
      Sem imagem
    </div>
  );
}

function SliderView({
  config,
  radiusClass,
  interactive,
}: {
  config: BeforeAfterWidgetConfig;
  radiusClass: string;
  interactive: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(
    clampSliderPosition(config.sliderInitialPosition),
  );
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(clampSliderPosition(next));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden select-none", radiusClass)}
      onPointerDown={
        interactive
          ? (event) => {
              draggingRef.current = true;
              containerRef.current?.setPointerCapture(event.pointerId);
              updateFromClientX(event.clientX);
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (event) => {
              if (!draggingRef.current) return;
              updateFromClientX(event.clientX);
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (event) => {
              draggingRef.current = false;
              containerRef.current?.releasePointerCapture(event.pointerId);
            }
          : undefined
      }
    >
      <SideImage side={config.before} radiusClass="rounded-none" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <SideImage side={config.after} radiusClass="rounded-none" />
      </div>
      <div
        className="absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-white shadow-lg"
        style={{ left: `${position}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/70 text-xs font-semibold text-white">
          ⇆
        </div>
      </div>
    </div>
  );
}

export function BeforeAfterWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  mode = "edit",
  className,
}: BeforeAfterWidgetRendererProps) {
  const colors = resolveBeforeAfterColors(config, design);
  const radiusClass = getMediaBorderRadiusClass(config.imageBorderRadius);
  const beforeLabel = resolveBeforeAfterField(config.beforeLabel, variables);
  const afterLabel = resolveBeforeAfterField(config.afterLabel, variables);
  const disclaimer = resolveBeforeAfterField(config.disclaimer, variables);
  const interactive = mode === "player" || mode === "preview";

  return (
    <div className={cn("w-full space-y-3", className)}>
      {config.layout === "columns" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p
              className="text-center text-xs font-semibold uppercase tracking-wide [font-family:var(--quiz-font-body)]"
              style={{ color: colors.label }}
            >
              {highlightVariables ? (
                <VariableHighlightedText text={config.beforeLabel} />
              ) : (
                beforeLabel
              )}
            </p>
            <SideImage side={config.before} radiusClass={radiusClass} />
          </div>
          <div className="space-y-2">
            <p
              className="text-center text-xs font-semibold uppercase tracking-wide [font-family:var(--quiz-font-body)]"
              style={{ color: colors.label }}
            >
              {highlightVariables ? (
                <VariableHighlightedText text={config.afterLabel} />
              ) : (
                afterLabel
              )}
            </p>
            <SideImage side={config.after} radiusClass={radiusClass} />
          </div>
        </div>
      ) : (
        <SliderView
          config={config}
          radiusClass={radiusClass}
          interactive={interactive}
        />
      )}

      {config.disclaimer ? (
        <p
          className="text-center text-[11px] leading-relaxed [font-family:var(--quiz-font-body)]"
          style={{ color: colors.disclaimer }}
        >
          {highlightVariables ? (
            <VariableHighlightedText text={config.disclaimer} />
          ) : (
            disclaimer
          )}
        </p>
      ) : null}
    </div>
  );
}
