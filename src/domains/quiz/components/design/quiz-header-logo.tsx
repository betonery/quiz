import type { DesignHeader } from "@/domains/quiz/types/design.types";
import { getQuizAssetPublicUrl } from "@/domains/quiz/utils/design-css.utils";
import { cn } from "@/lib/utils";

type QuizHeaderLogoProps = {
  header: DesignHeader;
  className?: string;
};

export function QuizHeaderLogo({ header, className }: QuizHeaderLogoProps) {
  if (header.logoType === "emoji") {
    return (
      <span
        className={cn("text-4xl leading-none", className)}
        role="img"
        aria-label="Logo"
      >
        {header.emoji || "😀"}
      </span>
    );
  }

  if (header.logoType === "url" && header.url) {
    return (
      <img
        src={header.url}
        alt="Logo"
        className={cn("max-h-12 max-w-[120px] object-contain", className)}
      />
    );
  }

  if (header.logoType === "file" && header.filePath) {
    const src = getQuizAssetPublicUrl(header.filePath);
    if (!src) return null;
    return (
      <img
        src={src}
        alt="Logo"
        className={cn("max-h-12 max-w-[120px] object-contain", className)}
      />
    );
  }

  return null;
}
