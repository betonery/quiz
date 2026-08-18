"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AudioWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { getMediaAudioSrc } from "@/domains/quiz/utils/media-source.utils";
import { resolveAudioColors } from "@/domains/quiz/utils/media-widget-colors.utils";
import { MediaAvatarPreview } from "@/domains/quiz/widgets/shared/media-preview";
import { cn } from "@/lib/utils";

type AudioWidgetRendererProps = {
  config: AudioWidgetConfig;
  design: QuizDesignSettings;
  className?: string;
};

const AVATAR_SIZE_CLASS = "size-14 shrink-0";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioWidgetRenderer({
  config,
  design,
  className,
}: AudioWidgetRendererProps) {
  const colors = resolveAudioColors(config, design);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const src = getMediaAudioSrc(config.source);
  const showAvatar = config.showAvatar !== false;
  const sentAtLabel = config.sentAtLabel.trim();

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(false);
  }, [src]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play().catch(() => setError(true));
    }
  }

  function handleSeek(event: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * duration;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      {showAvatar ? (
        <MediaAvatarPreview
          source={config.avatar}
          className={AVATAR_SIZE_CLASS}
        />
      ) : null}

      <div
        className="relative flex h-14 min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-2xl rounded-tl-md pl-3 pr-4 shadow-sm"
        style={{ backgroundColor: colors.bubble }}
      >
        {src ? (
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() =>
              setCurrentTime(audioRef.current?.currentTime ?? 0)
            }
            onLoadedMetadata={() =>
              setDuration(audioRef.current?.duration ?? 0)
            }
            onError={() => setError(true)}
          />
        ) : null}

        <button
          type="button"
          onClick={togglePlay}
          disabled={!src || error}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: colors.playButton }}
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            className="relative h-1 w-full cursor-pointer rounded-full bg-black/10"
            onClick={handleSeek}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" && audioRef.current) {
                audioRef.current.currentTime = Math.min(
                  duration,
                  audioRef.current.currentTime + 5,
                );
              }
              if (e.key === "ArrowLeft" && audioRef.current) {
                audioRef.current.currentTime = Math.max(
                  0,
                  audioRef.current.currentTime - 5,
                );
              }
            }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: colors.progress,
              }}
            />
          </div>

          <p
            className="mt-1 truncate text-[10px] tabular-nums leading-none"
            style={{ color: colors.time }}
          >
            {error
              ? "Áudio indisponível"
              : `${formatTime(currentTime)} / ${formatTime(duration)}`}
          </p>
        </div>

        {sentAtLabel ? (
          <span
            className="absolute bottom-1.5 right-4 text-[10px] leading-none"
            style={{ color: colors.time }}
          >
            {sentAtLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
