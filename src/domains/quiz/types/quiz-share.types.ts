import { z } from "zod";
import type {
  BuilderSnapshot,
  QuizStep,
  QuizVariable,
  QuizWidget,
} from "@/domains/quiz/types/builder.types";
import { quizDesignSettingsSchema } from "@/domains/quiz/types/design.types";
import { flowLayoutSchema } from "@/domains/quiz/types/flow.types";
import { quizSettingsSchema } from "@/domains/quiz/schemas/quiz-settings.schema";

export const SHARE_SNAPSHOT_VERSION = 1;

export const shareableQuizSnapshotSchema = z.object({
  schemaVersion: z.literal(SHARE_SNAPSHOT_VERSION),
  exportedAt: z.string(),
  sourceTitle: z.string().min(1),
  steps: z.array(z.custom<QuizStep>()),
  widgets: z.array(z.custom<QuizWidget>()),
  design: quizDesignSettingsSchema,
  flowLayout: flowLayoutSchema,
  variables: z.array(z.custom<QuizVariable>()),
  settings: quizSettingsSchema,
});

export type ShareableQuizSnapshot = z.infer<typeof shareableQuizSnapshotSchema>;

export type QuizShareLink = {
  id: string;
  quizId: string;
  workspaceId: string;
  shareToken: string;
  enabled: boolean;
  schemaVersion: number;
  sourceTitle: string;
  importCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type QuizSharePreview = {
  sourceTitle: string;
  stepCount: number;
  schemaVersion: number;
};

export type QuizShareSettings = {
  enabled: boolean;
  shareToken: string | null;
  shareUrl: string | null;
  sourceTitle: string;
  importCount: number;
  updatedAt: string | null;
  canEnable: boolean;
};

export function isSupportedShareSchemaVersion(version: number): boolean {
  return version === SHARE_SNAPSHOT_VERSION;
}

export function builderSnapshotFromShareable(
  snapshot: ShareableQuizSnapshot,
): Omit<BuilderSnapshot, "steps" | "widgets"> & {
  steps: QuizStep[];
  widgets: QuizWidget[];
} {
  return {
    steps: snapshot.steps,
    widgets: snapshot.widgets,
    design: snapshot.design,
    flowLayout: snapshot.flowLayout,
    variables: snapshot.variables,
    settings: snapshot.settings,
  };
}
