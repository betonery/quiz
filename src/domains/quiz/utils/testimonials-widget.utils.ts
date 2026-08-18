import type {
  CarouselSlide,
  TestimonialItem,
} from "@/domains/quiz/types/media.types";
import { getCarouselSlideImageSrc } from "@/domains/quiz/utils/media-source.utils";
import { resolveTemplate } from "@/domains/quiz/utils/variable-template.utils";

export function clampTestimonialRating(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function getTestimonialImageSrc(item: TestimonialItem): string | null {
  const slide: CarouselSlide = {
    id: item.id,
    text: item.text,
    imageType: item.imageType,
    emoji: item.emoji,
    url: item.url,
    filePath: item.filePath,
  };
  return getCarouselSlideImageSrc(slide);
}

export function resolveTestimonialField(
  value: string,
  variables: Record<string, unknown>,
): string {
  return resolveTemplate(value, variables);
}
