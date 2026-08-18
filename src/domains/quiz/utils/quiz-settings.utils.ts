import { quizSettingsSchema } from "@/domains/quiz/schemas/quiz-settings.schema";
import type { QuizSettings } from "@/domains/quiz/types/quiz-settings.types";

export const defaultQuizSettings: QuizSettings = {
  integrations: {},
  testIntegrationsInPreview: false,
};

export function parseQuizSettings(raw: unknown): QuizSettings {
  const parsed = quizSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return defaultQuizSettings;
  }

  const settings = parsed.data;
  const integrations = { ...settings.integrations };

  if (integrations.metaPixel && !integrations.metaPixel.enabled) {
    delete integrations.metaPixel;
  }

  if (integrations.utmify && !integrations.utmify.enabled) {
    delete integrations.utmify;
  }

  if (integrations.utmify?.pixelId === "") {
    delete integrations.utmify.pixelId;
  }

  return {
    integrations,
    testIntegrationsInPreview: settings.testIntegrationsInPreview ?? false,
  };
}
