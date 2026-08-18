"use client";

import { EMOJI_CATEGORIES } from "@/domains/quiz/constants/emoji-library.constants";
import { cn } from "@/lib/utils";

type EmojiPickerGridProps = {
  value?: string | null;
  onSelect: (emoji: string) => void;
  variant?: "default" | "dark";
  className?: string;
};

export function EmojiPickerGrid({
  value,
  onSelect,
  variant = "default",
  className,
}: EmojiPickerGridProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "max-h-48 space-y-3 overflow-y-auto",
        isDark && "rounded-lg border border-slate-700/60 bg-slate-900/60 p-3",
        className,
      )}
    >
      {Object.values(EMOJI_CATEGORIES).map((category) => (
        <div key={category.label}>
          <p
            className={cn(
              "mb-1.5 text-[10px] font-semibold uppercase tracking-wide",
              isDark ? "text-slate-500" : "text-muted-foreground",
            )}
          >
            {category.label}
          </p>
          <div className="grid grid-cols-5 gap-1">
            {category.emojis.map((emoji) => {
              const isSelected = value === emoji;

              return (
                <button
                  key={emoji}
                  type="button"
                  className={cn(
                    "rounded p-1.5 text-lg transition-colors",
                    isDark ? "hover:bg-slate-800" : "hover:bg-muted",
                    isSelected &&
                      (isDark
                        ? "bg-cyan-500/15 ring-1 ring-cyan-500/40"
                        : "bg-muted ring-1 ring-brand-secondary/40"),
                  )}
                  aria-label={`Selecionar emoji ${emoji}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(emoji)}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
