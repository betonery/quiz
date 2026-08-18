import type {
  CarouselSlide,
  MediaAudioSource,
  MediaAvatarSource,
  MediaImageSource,
} from "@/domains/quiz/types/media.types";
import type { OptionItem } from "@/domains/quiz/types/builder.types";
import { getQuizAssetPublicUrl } from "@/domains/quiz/utils/design-css.utils";

export function getMediaImageSrc(source: MediaImageSource): string | null {
  if (source.sourceType === "url" && source.url?.trim()) {
    return source.url.trim();
  }
  if (source.sourceType === "file" && source.filePath) {
    return getQuizAssetPublicUrl(source.filePath);
  }
  return null;
}

export function getMediaAudioSrc(source: MediaAudioSource): string | null {
  if (source.sourceType === "url" && source.url?.trim()) {
    return source.url.trim();
  }
  if (source.sourceType === "file" && source.filePath) {
    return getQuizAssetPublicUrl(source.filePath);
  }
  return null;
}

export function getMediaAvatarSrc(source: MediaAvatarSource): string | null {
  return getMediaImageSrc(source);
}

export function getCarouselSlideImageSrc(slide: CarouselSlide): string | null {
  if (slide.imageType === "url" && slide.url?.trim()) {
    return slide.url.trim();
  }
  if (slide.imageType === "file" && slide.filePath) {
    return getQuizAssetPublicUrl(slide.filePath);
  }
  return null;
}

export function getOptionImageSrcFromItem(option: OptionItem): string | null {
  if (option.imageType === "url" && option.url?.trim()) {
    return option.url.trim();
  }
  if (option.imageType === "file" && option.filePath) {
    return getQuizAssetPublicUrl(option.filePath);
  }
  return null;
}
