"use client";

import { ImageIcon } from "lucide-react";
import type { CarouselSlide } from "@/domains/quiz/types/media.types";
import type {
  MediaAvatarSource,
  MediaImageSource,
} from "@/domains/quiz/types/media.types";
import {
  getCarouselSlideImageSrc,
  getMediaAvatarSrc,
  getMediaImageSrc,
} from "@/domains/quiz/utils/media-source.utils";
import { cn } from "@/lib/utils";

type MediaImagePreviewProps = {
  source: MediaImageSource;
  className?: string;
  compact?: boolean;
};

type CarouselSlidePreviewProps = {
  slide: CarouselSlide;
  className?: string;
  compact?: boolean;
};

type MediaAvatarPreviewProps = {
  source: MediaAvatarSource;
  className?: string;
  size?: "sm" | "md";
};

const sizeClasses = {
  sm: "size-10",
  md: "size-14",
  compact: "size-8",
};

export function MediaImagePreview({
  source,
  className,
  compact = false,
}: MediaImagePreviewProps) {
  const src = getMediaImageSrc(source);
  const box = compact ? sizeClasses.compact : sizeClasses.md;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-lg object-cover", box, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-dashed border-muted-foreground/30 bg-muted text-muted-foreground",
        box,
        className,
      )}
    >
      <ImageIcon className="size-4" />
    </span>
  );
}

export function CarouselSlidePreview({
  slide,
  className,
  compact = false,
}: CarouselSlidePreviewProps) {
  const box = compact ? sizeClasses.compact : sizeClasses.md;

  if (slide.imageType === "emoji" && slide.emoji) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center text-xl leading-none",
          box,
          className,
        )}
      >
        {slide.emoji}
      </span>
    );
  }

  const src = getCarouselSlideImageSrc(slide);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-lg object-cover", box, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-sm",
        box,
        className,
      )}
    >
      ?
    </span>
  );
}

export function MediaAvatarPreview({
  source,
  className,
  size = "md",
}: MediaAvatarPreviewProps) {
  const src = getMediaAvatarSrc(source);
  const box = sizeClasses[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", box, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-semibold",
        box,
        className,
      )}
    >
      ?
    </span>
  );
}
