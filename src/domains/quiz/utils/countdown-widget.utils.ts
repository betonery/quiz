import type { CountdownWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";

export function getCountdownStorageKey(
  quizSlug: string,
  widgetId: string,
): string {
  return `adquiz:countdown:${quizSlug}:${widgetId}`;
}

export type CountdownStorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function resolveSessionCountdownEndTimestamp(
  durationSeconds: number,
  storage: CountdownStorageAdapter,
  key: string,
  now: number,
): number {
  const durationMs = durationSeconds * 1000;
  const raw = storage.getItem(key);
  let startedAt = now;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { startedAt?: number };
      const existingStart =
        typeof parsed.startedAt === "number" ? parsed.startedAt : now;

      if (existingStart + durationMs > now) {
        startedAt = existingStart;
      } else {
        startedAt = now;
        storage.setItem(key, JSON.stringify({ startedAt }));
      }
    } catch {
      storage.setItem(key, JSON.stringify({ startedAt: now }));
    }
  } else {
    storage.setItem(key, JSON.stringify({ startedAt: now }));
  }

  return startedAt + durationMs;
}

export function getCountdownEndTimestamp(
  config: Pick<
    CountdownWidgetConfig,
    "mode" | "sessionDurationSeconds" | "targetDateIso"
  >,
  quizSlug: string,
  widgetId: string,
  now = Date.now(),
): number {
  if (config.mode === "fixed" && config.targetDateIso) {
    return new Date(config.targetDateIso).getTime();
  }

  if (typeof window === "undefined") {
    return now + config.sessionDurationSeconds * 1000;
  }

  const key = getCountdownStorageKey(quizSlug, widgetId);

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore legacy storage cleanup failures.
  }

  return resolveSessionCountdownEndTimestamp(
    config.sessionDurationSeconds,
    window.sessionStorage,
    key,
    now,
  );
}

export function getRemainingSeconds(
  endTimestamp: number,
  now = Date.now(),
): number {
  return Math.max(0, Math.floor((endTimestamp - now) / 1000));
}

export function getCountdownPlaceholderSeconds(
  config: Pick<
    CountdownWidgetConfig,
    "mode" | "sessionDurationSeconds" | "targetDateIso"
  >,
): number {
  return config.sessionDurationSeconds;
}

export function didCountdownReachZero(
  previousRemainingSeconds: number,
  remainingSeconds: number,
): boolean {
  return previousRemainingSeconds > 0 && remainingSeconds <= 0;
}

export function formatCountdownParts(totalSeconds: number, showDays: boolean) {
  let remaining = totalSeconds;
  const days = showDays ? Math.floor(remaining / 86400) : 0;
  if (showDays) remaining -= days * 86400;

  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return { days, hours, minutes, seconds };
}

export function resolveCountdownColors(
  config: Pick<
    CountdownWidgetConfig,
    | "digitBackgroundColor"
    | "digitTextColor"
    | "labelColor"
    | "separatorColor"
    | "accentColor"
  >,
  design: QuizDesignSettings,
) {
  return {
    digitBackground: config.digitBackgroundColor ?? design.colors.primary,
    digitText: config.digitTextColor ?? "#ffffff",
    label: config.labelColor ?? design.colors.texts,
    separator: config.separatorColor ?? design.colors.primary,
    accent: config.accentColor ?? `${design.colors.primary}33`,
  };
}

export function padCountdownUnit(value: number): string {
  return String(value).padStart(2, "0");
}

export function normalizeCountdownLegacyConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { onExpireAction, redirectUrl, flowOutputEnabled, ...rest } = config;

  return {
    ...rest,
    flowOutputEnabled:
      typeof flowOutputEnabled === "boolean"
        ? flowOutputEnabled
        : onExpireAction === "next_step",
  };
}
