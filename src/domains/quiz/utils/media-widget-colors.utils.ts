import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type { AudioWidgetConfig } from "@/domains/quiz/types/builder.types";

export function resolveAudioColors(
  config: AudioWidgetConfig,
  design: QuizDesignSettings,
) {
  return {
    bubble: config.bubbleColor ?? "#dcf8c6",
    playButton: config.playButtonColor ?? "#25d366",
    progress: config.progressColor ?? "#25d366",
    time: config.timeColor ?? design.colors.texts,
  };
}

export function resolveCarouselColors(
  config: {
    arrowColor: string | null;
    paginationColor: string | null;
  },
  design: QuizDesignSettings,
) {
  return {
    arrow: config.arrowColor ?? design.colors.primary,
    pagination: config.paginationColor ?? design.colors.primary,
  };
}
