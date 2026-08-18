"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { TestimonialsWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { TestimonialItem } from "@/domains/quiz/types/media.types";
import {
  getTestimonialImageSrc,
  resolveTestimonialField,
} from "@/domains/quiz/utils/testimonials-widget.utils";
import { cn } from "@/lib/utils";

type TestimonialsWidgetRendererProps = {
  config: TestimonialsWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  className?: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} de 5 estrelas`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            "size-3.5",
            index < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-300",
          )}
        />
      ))}
    </div>
  );
}

function TestimonialAvatar({
  item,
  stacked = false,
}: {
  item: TestimonialItem;
  stacked?: boolean;
}) {
  const imageSrc = getTestimonialImageSrc(item);
  const sizeClass = stacked ? "size-16 text-3xl" : "size-12 text-2xl";

  if (item.imageType === "emoji" && item.emoji) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-slate-100",
          sizeClass,
        )}
      >
        {item.emoji}
      </div>
    );
  }

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400",
        sizeClass,
      )}
    >
      ?
    </div>
  );
}

export function TestimonialCard({
  item,
  design,
  variables = {},
  className,
  variant = "horizontal",
}: {
  item: TestimonialItem;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  className?: string;
  variant?: "horizontal" | "vertical";
}) {
  const name = resolveTestimonialField(item.name, variables);
  const handle = resolveTestimonialField(item.handle, variables);
  const text = resolveTestimonialField(item.text, variables);

  const content = (
    <div
      className={cn(
        "min-w-0 space-y-1",
        variant === "vertical" &&
          "flex w-full flex-1 flex-col items-center text-center",
      )}
    >
      <StarRating rating={item.rating} />
      {name.trim() && (
        <p
          className="text-sm font-semibold leading-tight [font-family:var(--quiz-font-body)]"
          style={{ color: design.colors.texts }}
        >
          {name}
        </p>
      )}
      {handle.trim() && (
        <p className="text-xs text-slate-500 [font-family:var(--quiz-font-body)]">
          {handle}
        </p>
      )}
      {text.trim() && (
        <p
          className={cn(
            "text-sm leading-relaxed text-slate-600 [font-family:var(--quiz-font-body)]",
            variant === "vertical" && "flex-1",
          )}
          style={{ color: design.colors.texts }}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (variant === "vertical") {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-4",
          className,
        )}
      >
        <TestimonialAvatar item={item} stacked />
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-slate-200 bg-white p-3",
        className,
      )}
    >
      <TestimonialAvatar item={item} />
      <div className="min-w-0 flex-1">{content}</div>
    </div>
  );
}

function TestimonialsSlideLayout({
  config,
  design,
  variables,
}: {
  config: TestimonialsWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
}) {
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

  const showControls = config.items.length > 1;

  return (
    <div className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {config.items.map((item) => (
            <div key={item.id} className="min-w-0 flex-[0_0_100%] px-1">
              <TestimonialCard
                item={item}
                design={design}
                variables={variables}
              />
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute top-1/2 left-0 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute top-1/2 right-0 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Próximo depoimento"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {config.showPagination && showControls && (
        <div className="mt-3 flex justify-center gap-1.5">
          {config.items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-2 rounded-full bg-slate-400 transition-all",
                index === selectedIndex
                  ? "scale-110 opacity-100"
                  : "opacity-40",
              )}
              aria-label={`Ir para depoimento ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TestimonialsWidgetRenderer({
  config,
  design,
  variables,
  className,
}: TestimonialsWidgetRendererProps) {
  if (config.items.length === 0) {
    return null;
  }

  if (config.layout === "slide") {
    return (
      <div className={cn("w-full", className)}>
        <TestimonialsSlideLayout
          config={config}
          design={design}
          variables={variables}
        />
      </div>
    );
  }

  if (config.layout === "grid") {
    return (
      <div
        className={cn(
          "grid w-full auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2",
          className,
        )}
      >
        {config.items.map((item) => (
          <TestimonialCard
            key={item.id}
            item={item}
            design={design}
            variables={variables}
            variant="vertical"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {config.items.map((item) => (
        <TestimonialCard
          key={item.id}
          item={item}
          design={design}
          variables={variables}
        />
      ))}
    </div>
  );
}
