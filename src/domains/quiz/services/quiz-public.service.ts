import {
  isWorkspaceSubscriptionActive,
  isWorkspaceSubscriptionActiveForPublicAccess,
} from "@/domains/billing/services/subscription.service";
import { loadQuizBuilder } from "@/domains/quiz/services/quiz-builder.service";
import { loadDesignSettings } from "@/domains/quiz/services/quiz-design.service";
import { getQuizBySlug } from "@/domains/quiz/services/quiz-publish.service";
import type {
  BuilderSnapshot,
  QuizStep,
  QuizWidget,
  StepSettings,
  WidgetType,
} from "@/domains/quiz/types/builder.types";
import {
  defaultStepSettings,
  stepSettingsSchema,
} from "@/domains/quiz/types/builder.types";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { parseDesignSettings } from "@/domains/quiz/utils/design-settings.utils";
import { parseFlowLayout } from "@/domains/quiz/utils/flow-layout.utils";
import { parseQuizVariables } from "@/domains/quiz/utils/variable-registry.utils";
import { parseQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";
import type { QuizSettings } from "@/domains/quiz/types/quiz-settings.types";
import { parseWidgetConfig } from "@/domains/quiz/utils/widget-config.utils";
import { loadFlowLayout } from "@/domains/quiz/services/quiz-flow.service";
import { loadQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import { loadQuizSettings } from "@/domains/quiz/services/quiz-settings.service";
import type { FlowLayout } from "@/domains/quiz/types/flow.types";
import type { QuizVariable } from "@/domains/quiz/types/builder.types";
import { userHasWorkspaceAccess } from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { unstable_cache } from "next/cache";

// Janela de revalidação (ISR) para o conteúdo publicado do funil. Conteúdo
// publicado muda raramente; mudanças (publicar/alterar slug) invalidam o cache
// imediatamente via `revalidateTag(publishedQuizCacheTag(slug))`.
const PUBLISHED_QUIZ_REVALIDATE_SECONDS = 300;

export function publishedQuizCacheTag(slug: string): string {
  return `published-quiz:${slug}`;
}

export type QuizPlayerData = {
  quiz: Quiz;
  steps: QuizStep[];
  widgets: QuizWidget[];
  design: QuizDesignSettings;
  flowLayout: FlowLayout;
  variables: QuizVariable[];
  settings: QuizSettings;
  isPreview: boolean;
};

export type PublicQuizLoadResult =
  | { kind: "success"; data: QuizPlayerData }
  | { kind: "not_found" }
  | { kind: "subscription_inactive" };

function parseStepSettings(raw: unknown): StepSettings {
  const parsed = stepSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : defaultStepSettings;
}

function parsePublishedSnapshot(raw: unknown): BuilderSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as {
    steps?: unknown;
    widgets?: unknown;
    design?: unknown;
    flowLayout?: unknown;
    variables?: unknown;
    settings?: unknown;
  };
  if (!Array.isArray(data.steps) || !Array.isArray(data.widgets)) return null;

  const steps: QuizStep[] = data.steps.map((s: Record<string, unknown>) => ({
    id: String(s.id),
    quizId: String(s.quizId ?? s.quiz_id),
    workspaceId: String(s.workspaceId ?? s.workspace_id),
    title: String(s.title),
    position: Number(s.position),
    settings: parseStepSettings(s.settings),
  }));

  const widgets: QuizWidget[] = data.widgets.map(
    (w: Record<string, unknown>) => {
      const type = String(w.type) as WidgetType;
      return {
        id: String(w.id),
        stepId: String(w.stepId ?? w.step_id),
        workspaceId: String(w.workspaceId ?? w.workspace_id),
        type,
        position: Number(w.position),
        config: parseWidgetConfig(type, w.config),
      };
    },
  );

  return {
    steps,
    widgets,
    design: parseDesignSettings(data.design),
    flowLayout: parseFlowLayout(data.flowLayout),
    variables: parseQuizVariables(data.variables),
    settings: parseQuizSettings(data.settings),
  };
}

function mapQuiz(row: {
  id: string;
  workspace_id: string;
  title: string;
  slug: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  folder_id?: string | null;
}): Quiz {
  return {
    ...row,
    folder_id: row.folder_id ?? null,
    status: row.status as Quiz["status"],
  };
}

async function ensureWorkspaceSubscriptionActiveForPublic(
  workspaceId: string,
): Promise<PublicQuizLoadResult | null> {
  const isActive =
    await isWorkspaceSubscriptionActiveForPublicAccess(workspaceId);
  if (!isActive) {
    return { kind: "subscription_inactive" };
  }

  return null;
}

async function ensureWorkspaceSubscriptionActiveForMember(
  workspaceId: string,
): Promise<PublicQuizLoadResult | null> {
  const isActive = await isWorkspaceSubscriptionActive(workspaceId);
  if (!isActive) {
    return { kind: "subscription_inactive" };
  }

  return null;
}

async function loadPublishedQuizUncached(
  slug: string,
): Promise<PublicQuizLoadResult> {
  // Cliente sem cookies (admin/service role) para que a leitura seja cacheável
  // via `unstable_cache` — `createClient()` (cookies) força renderização
  // dinâmica e impede o cache. Selecionamos apenas colunas seguras.
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select(
      "id, workspace_id, title, slug, status, created_by, created_at, updated_at, published_at, published_content",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return { kind: "not_found" };
  }

  const subscriptionBlock = await ensureWorkspaceSubscriptionActiveForPublic(
    data.workspace_id,
  );
  if (subscriptionBlock) {
    return subscriptionBlock;
  }

  const snapshot = parsePublishedSnapshot(data.published_content);
  if (!snapshot || snapshot.steps.length === 0) {
    return { kind: "not_found" };
  }

  return {
    kind: "success",
    data: {
      quiz: mapQuiz(data),
      steps: snapshot.steps,
      widgets: snapshot.widgets,
      design: snapshot.design,
      flowLayout: snapshot.flowLayout,
      variables: snapshot.variables,
      settings: snapshot.settings,
      isPreview: false,
    },
  };
}

export async function loadPublishedQuiz(
  slug: string,
): Promise<PublicQuizLoadResult> {
  const cached = unstable_cache(
    () => loadPublishedQuizUncached(slug),
    ["published-quiz", slug],
    {
      revalidate: PUBLISHED_QUIZ_REVALIDATE_SECONDS,
      tags: [publishedQuizCacheTag(slug)],
    },
  );

  return cached();
}

export async function getPublishedQuizContent(
  slug: string,
): Promise<QuizPlayerData | null> {
  const result = await loadPublishedQuiz(slug);
  return result.kind === "success" ? result.data : null;
}

export async function loadPreviewQuiz(
  slug: string,
  userId: string,
): Promise<PublicQuizLoadResult> {
  const quiz = await getQuizBySlug(slug);
  if (!quiz) {
    return { kind: "not_found" };
  }

  const hasAccess = await userHasWorkspaceAccess(userId, quiz.workspace_id);
  if (!hasAccess) {
    return { kind: "not_found" };
  }

  const subscriptionBlock = await ensureWorkspaceSubscriptionActiveForMember(
    quiz.workspace_id,
  );
  if (subscriptionBlock) {
    return subscriptionBlock;
  }

  const { steps, widgets } = await loadQuizBuilder(quiz.id);
  if (steps.length === 0) {
    return { kind: "not_found" };
  }

  const design = await loadDesignSettings(quiz.id);
  const flowLayout = await loadFlowLayout(quiz.id);
  const variables = await loadQuizVariables(quiz.id);
  const settings = await loadQuizSettings(quiz.id);

  return {
    kind: "success",
    data: {
      quiz,
      steps,
      widgets,
      design,
      flowLayout,
      variables,
      settings,
      isPreview: true,
    },
  };
}

export async function getPreviewQuizContent(
  slug: string,
  userId: string,
): Promise<QuizPlayerData | null> {
  const result = await loadPreviewQuiz(slug, userId);
  return result.kind === "success" ? result.data : null;
}
