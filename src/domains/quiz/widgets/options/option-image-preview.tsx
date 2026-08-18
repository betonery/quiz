import type {
  OptionItem,
  OptionsWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import {
  getOptionImageSizeClasses,
  getOptionImageSrc,
} from "@/domains/quiz/utils/options-widget-styles.utils";
import { cn } from "@/lib/utils";

type OptionImagePreviewProps = {
  option: OptionItem;
  className?: string;
  /** Tamanho compacto para listas do painel de propriedades */
  compact?: boolean;
  imageSize?: OptionsWidgetConfig["imageSize"];
};

export function OptionImagePreview({
  option,
  className,
  compact = false,
  imageSize = "md",
}: OptionImagePreviewProps) {
  const sizes = compact
    ? getOptionImageSizeClasses("sm")
    : getOptionImageSizeClasses(imageSize);
  const src = getOptionImageSrc(option);

  if (option.imageType === "emoji" && option.emoji) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center leading-none",
          sizes.box,
          sizes.emoji,
          className,
        )}
        role="img"
        aria-hidden
      >
        {option.emoji}
      </span>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-lg object-cover", sizes.box, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-sm",
        sizes.box,
        className,
      )}
    >
      ?
    </span>
  );
}
