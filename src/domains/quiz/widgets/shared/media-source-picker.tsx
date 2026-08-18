"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadQuizAssetAction } from "@/domains/quiz/actions/upload-quiz-asset.action";
import {
  MAX_QUIZ_ASSET_FILE_SIZE,
  MAX_QUIZ_ASSET_FILE_SIZE_LABEL,
  MAX_QUIZ_AUDIO_FILE_SIZE,
  MAX_QUIZ_AUDIO_FILE_SIZE_LABEL,
  type QuizAssetSubfolder,
} from "@/domains/quiz/constants/quiz-asset.constants";
import {
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { EmojiPickerGrid } from "@/domains/quiz/components/builder/emoji-picker-grid";
import type { CarouselSlide } from "@/domains/quiz/types/media.types";
import type {
  MediaAudioSource,
  MediaAvatarSource,
  MediaImageSource,
  MediaSourceType,
} from "@/domains/quiz/types/media.types";
import {
  CarouselSlidePreview,
  MediaAvatarPreview,
  MediaImagePreview,
} from "@/domains/quiz/widgets/shared/media-preview";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { cn } from "@/lib/utils";

type MediaSourcePickerMode = "image" | "carousel-slide" | "avatar" | "audio";

type MediaSourcePickerProps = {
  mode: MediaSourcePickerMode;
  value: MediaImageSource | MediaAudioSource | CarouselSlide;
  onChange: (patch: Record<string, unknown>) => void;
  className?: string;
  compact?: boolean;
  subfolder?: QuizAssetSubfolder;
};

function getSourceType(
  value: MediaImageSource | MediaAudioSource | CarouselSlide,
  mode: MediaSourcePickerMode,
): string {
  if (mode === "carousel-slide") {
    return (value as CarouselSlide).imageType;
  }
  return (value as MediaImageSource | MediaAudioSource).sourceType;
}

export function MediaSourcePicker({
  mode,
  value,
  onChange,
  className,
  compact = false,
  subfolder = "media",
}: MediaSourcePickerProps) {
  const workspaceSlug = useBuilderStore((s) => s.workspaceSlug);
  const quizId = useBuilderStore((s) => s.quizId);
  const setFeedback = useBuilderStore((s) => s.setFeedback);
  const [open, setOpen] = useState(false);
  const [isUploading, startUpload] = useTransition();

  const isAudio = mode === "audio";
  const assetKind = isAudio ? "audio" : "image";
  const maxSize = isAudio ? MAX_QUIZ_AUDIO_FILE_SIZE : MAX_QUIZ_ASSET_FILE_SIZE;
  const maxSizeLabel = isAudio
    ? MAX_QUIZ_AUDIO_FILE_SIZE_LABEL
    : MAX_QUIZ_ASSET_FILE_SIZE_LABEL;
  const accept = isAudio
    ? "audio/mpeg,audio/mp4,audio/ogg,audio/webm,audio/wav"
    : "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";

  function renderPreview() {
    if (mode === "carousel-slide") {
      return (
        <CarouselSlidePreview
          slide={value as CarouselSlide}
          compact={compact}
        />
      );
    }
    if (mode === "avatar") {
      return (
        <MediaAvatarPreview
          source={value as MediaAvatarSource}
          size={compact ? "sm" : "md"}
        />
      );
    }
    if (mode === "audio") {
      return (
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400",
            compact && "size-8",
          )}
        >
          🎵
        </span>
      );
    }
    return (
      <MediaImagePreview source={value as MediaImageSource} compact={compact} />
    );
  }

  const currentType = getSourceType(value, mode);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg transition-opacity hover:opacity-80"
        aria-label="Alterar mídia"
      >
        {renderPreview()}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card p-3 shadow-lg">
          <PropertyField label="Tipo">
            <PropertySelect
              value={currentType}
              onChange={(selected) => {
                if (mode === "carousel-slide") {
                  onChange({ imageType: selected });
                } else {
                  onChange({ sourceType: selected as MediaSourceType });
                }
              }}
            >
              {mode === "carousel-slide" ? (
                <>
                  <option value="emoji">Emoji</option>
                  <option value="url">URL</option>
                  <option value="file">Arquivo</option>
                  <option value="none">Nenhum</option>
                </>
              ) : (
                <>
                  <option value="url">URL</option>
                  <option value="file">Arquivo</option>
                </>
              )}
            </PropertySelect>
          </PropertyField>

          {mode === "carousel-slide" && currentType === "emoji" && (
            <EmojiPickerGrid
              className="mt-2"
              value={(value as CarouselSlide).emoji}
              onSelect={(emoji) => {
                onChange({ emoji, imageType: "emoji" });
                setOpen(false);
              }}
            />
          )}

          {(mode === "carousel-slide"
            ? currentType === "url"
            : currentType === "url") && (
            <Input
              value={
                mode === "carousel-slide"
                  ? ((value as CarouselSlide).url ?? "")
                  : ((value as MediaImageSource).url ?? "")
              }
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder={isAudio ? "https://.../audio.mp3" : "https://..."}
              className="mt-2 bg-background shadow-sm"
            />
          )}

          {currentType === "file" && (
            <Input
              type="file"
              accept={accept}
              disabled={isUploading}
              className="mt-2 bg-background shadow-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > maxSize) {
                  setFeedback(`Arquivo muito grande (máx. ${maxSizeLabel})`);
                  e.target.value = "";
                  return;
                }

                const formData = new FormData();
                formData.append("file", file);
                startUpload(async () => {
                  const result = await uploadQuizAssetAction(
                    workspaceSlug,
                    quizId,
                    formData,
                    subfolder,
                    assetKind,
                  );
                  if (result.success && result.filePath) {
                    if (mode === "carousel-slide") {
                      onChange({
                        filePath: result.filePath,
                        imageType: "file",
                      });
                    } else {
                      onChange({
                        filePath: result.filePath,
                        sourceType: "file",
                      });
                    }
                    setFeedback("Arquivo enviado");
                    setOpen(false);
                  } else if (!result.success) {
                    setFeedback(result.error);
                  }
                });
              }}
            />
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setOpen(false)}
          >
            Fechar
          </Button>
        </div>
      )}
    </div>
  );
}
