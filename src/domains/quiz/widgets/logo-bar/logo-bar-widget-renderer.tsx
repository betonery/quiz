"use client";

import useEmblaCarousel from "embla-carousel-react";
import type { LogoBarWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { VariableHighlightedText } from "@/domains/quiz/components/builder/variable-highlighted-text";
import {
  getLogoBarItemSrc,
  getLogoBarMarqueeDurationSec,
  resolveLogoBarColors,
  resolveLogoBarTitle,
} from "@/domains/quiz/utils/logo-bar-widget.utils";
import { cn } from "@/lib/utils";

type LogoBarWidgetRendererProps = {
  config: LogoBarWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  highlightVariables?: boolean;
  className?: string;
};

function LogoImage({
  src,
  alt,
  heightPx,
  grayscale,
}: {
  src: string;
  alt: string;
  heightPx: number;
  grayscale: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(
        "w-auto max-w-[120px] object-contain",
        grayscale && "grayscale",
      )}
      style={{ height: `${heightPx}px` }}
    />
  );
}

function LogoMarquee({
  items,
  itemHeightPx,
  grayscale,
  durationSec,
}: {
  items: LogoBarWidgetConfig["items"];
  itemHeightPx: number;
  grayscale: boolean;
  durationSec: number;
}) {
  const loopItems = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <div
        className="logo-bar-marquee-track flex w-max items-center"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {loopItems.map((item, index) => {
          const src = getLogoBarItemSrc(item);
          if (!src) return null;
          return (
            <div
              key={`${item.id}-${index}`}
              className="flex shrink-0 items-center justify-center px-6"
            >
              <LogoImage
                src={src}
                alt={item.alt}
                heightPx={itemHeightPx}
                grayscale={grayscale}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LogoCarousel({
  items,
  itemHeightPx,
  grayscale,
}: {
  items: LogoBarWidgetConfig["items"];
  itemHeightPx: number;
  grayscale: boolean;
}) {
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: true,
  });

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {items.map((item) => {
          const src = getLogoBarItemSrc(item);
          if (!src) return null;
          return (
            <div
              key={item.id}
              className="flex min-w-0 flex-[0_0_33%] items-center justify-center px-3 sm:flex-[0_0_25%]"
            >
              <LogoImage
                src={src}
                alt={item.alt}
                heightPx={itemHeightPx}
                grayscale={grayscale}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LogoBarWidgetRenderer({
  config,
  design,
  variables,
  highlightVariables = false,
  className,
}: LogoBarWidgetRendererProps) {
  const colors = resolveLogoBarColors(config, design);
  const title = resolveLogoBarTitle(config.title, variables);
  const visibleItems = config.items.filter((item) => getLogoBarItemSrc(item));
  const showTitle = config.showTitle && config.title;

  if (visibleItems.length === 0) {
    return (
      <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 px-4 py-8 text-sm text-muted-foreground">
        Adicione logos para exibir a barra
      </div>
    );
  }

  const useMarquee = config.mode === "carousel" && config.autoplay;
  const marqueeDurationSec = getLogoBarMarqueeDurationSec(
    config.autoplayDelayMs,
    visibleItems.length,
  );

  return (
    <div className={cn("w-full space-y-3", className)}>
      {showTitle ? (
        <p
          className="text-center text-xs font-semibold uppercase tracking-wide [font-family:var(--quiz-font-body)]"
          style={{ color: colors.title }}
        >
          {highlightVariables && config.title ? (
            <VariableHighlightedText text={config.title} />
          ) : (
            title
          )}
        </p>
      ) : null}

      {config.mode === "carousel" ? (
        useMarquee ? (
          <LogoMarquee
            items={visibleItems}
            itemHeightPx={config.itemHeightPx}
            grayscale={config.grayscale}
            durationSec={marqueeDurationSec}
          />
        ) : (
          <LogoCarousel
            items={visibleItems}
            itemHeightPx={config.itemHeightPx}
            grayscale={config.grayscale}
          />
        )
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {visibleItems.map((item) => {
            const src = getLogoBarItemSrc(item);
            if (!src) return null;
            return (
              <LogoImage
                key={item.id}
                src={src}
                alt={item.alt}
                heightPx={config.itemHeightPx}
                grayscale={config.grayscale}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
