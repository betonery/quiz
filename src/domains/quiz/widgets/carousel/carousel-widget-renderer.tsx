"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CarouselWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";
import { getCarouselSlideImageSrc } from "@/domains/quiz/utils/media-source.utils";
import { resolveCarouselColors } from "@/domains/quiz/utils/media-widget-colors.utils";
import { getMediaBorderRadiusClass } from "@/domains/quiz/utils/media-widget-styles.utils";
import { cn } from "@/lib/utils";

type CarouselWidgetRendererProps = {
  config: CarouselWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  className?: string;
};

export function CarouselWidgetRenderer({
  config,
  design,
  variables,
  className,
}: CarouselWidgetRendererProps) {
  const colors = resolveCarouselColors(config, design);
  const radiusClass = getMediaBorderRadiusClass(config.imageBorderRadius);

  const plugins = config.autoplay
    ? [
        Autoplay({
          delay: config.autoplayDelayMs,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ]
    : [];

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: config.loop, align: "start" },
    plugins,
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (config.slides.length === 0) {
    return null;
  }

  const showArrows = config.slides.length > 1;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {config.slides.map((slide) => {
            const imageSrc = getCarouselSlideImageSrc(slide);
            const text = resolveTemplate(slide.text, variables ?? {});

            return (
              <div key={slide.id} className="min-w-0 flex-[0_0_100%] px-1">
                <div className="flex flex-col items-center gap-3 text-center">
                  {(config.layout === "image_text" ||
                    config.layout === "image") && (
                    <div className="flex w-full justify-center">
                      {slide.imageType === "emoji" && slide.emoji ? (
                        <span className="text-5xl leading-none">
                          {slide.emoji}
                        </span>
                      ) : imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageSrc}
                          alt=""
                          className={cn(
                            "max-h-48 w-full object-cover",
                            radiusClass,
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            "flex h-32 w-full items-center justify-center bg-muted text-muted-foreground",
                            radiusClass,
                          )}
                        >
                          Sem imagem
                        </span>
                      )}
                    </div>
                  )}
                  {(config.layout === "image_text" ||
                    config.layout === "text") &&
                    text.trim() && (
                      <p
                        className="text-sm leading-relaxed [font-family:var(--quiz-font-body)]"
                        style={{ color: design.colors.texts }}
                      >
                        {text}
                      </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute top-1/2 left-0 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            style={{ color: colors.arrow }}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute top-1/2 right-0 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            style={{ color: colors.arrow }}
            aria-label="Próximo slide"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {config.showPagination && config.slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {config.slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-2 rounded-full transition-all",
                index === selectedIndex ? "scale-110" : "opacity-40",
              )}
              style={{
                backgroundColor: colors.pagination,
              }}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
