import {
  defaultQuizDesignSettings,
  quizDesignSettingsSchema,
  type QuizDesignSettings,
} from "@/domains/quiz/types/design.types";

export function parseDesignSettings(raw: unknown): QuizDesignSettings {
  const merged = {
    ...defaultQuizDesignSettings,
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    header: {
      ...defaultQuizDesignSettings.header,
      ...((typeof raw === "object" &&
        raw !== null &&
        (raw as { header?: unknown }).header) ||
        {}),
    },
    colors: {
      ...defaultQuizDesignSettings.colors,
      ...((typeof raw === "object" &&
        raw !== null &&
        (raw as { colors?: unknown }).colors) ||
        {}),
    },
    typography: {
      ...defaultQuizDesignSettings.typography,
      ...((typeof raw === "object" &&
        raw !== null &&
        (raw as { typography?: unknown }).typography) ||
        {}),
    },
    animation: {
      ...defaultQuizDesignSettings.animation,
      ...((typeof raw === "object" &&
        raw !== null &&
        (raw as { animation?: unknown }).animation) ||
        {}),
    },
  };

  const parsed = quizDesignSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultQuizDesignSettings;
}
