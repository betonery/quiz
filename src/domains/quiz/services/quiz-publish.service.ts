import type { BuilderSnapshot } from "@/domains/quiz/types/builder.types";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import { saveQuizBuilder } from "@/domains/quiz/services/quiz-builder.service";
import { saveDesignSettings } from "@/domains/quiz/services/quiz-design.service";
import { saveFlowLayout } from "@/domains/quiz/services/quiz-flow.service";
import { saveQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import { saveQuizSettings } from "@/domains/quiz/services/quiz-settings.service";
import { hasUnpublishedChanges } from "@/domains/quiz/utils/publish-status";
import { stripWebhookSecretsFromFlowLayout } from "@/domains/quiz/utils/flow-public.utils";
import { createClient } from "@/services/supabase/server";
import type { Json } from "@/types/database.types";

export { hasUnpublishedChanges };

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
  folder_id: string | null;
}): Quiz {
  return {
    ...row,
    status: row.status as Quiz["status"],
  };
}

export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapQuiz(data);
}

export async function publishQuiz(
  quizId: string,
  workspaceId: string,
  snapshot: BuilderSnapshot,
): Promise<void> {
  const supabase = await createClient();

  await saveQuizBuilder(quizId, workspaceId, snapshot.steps, snapshot.widgets);
  await saveDesignSettings(quizId, workspaceId, snapshot.design);
  await saveFlowLayout(quizId, workspaceId, snapshot.flowLayout);
  await saveQuizVariables(quizId, workspaceId, snapshot.variables);
  await saveQuizSettings(quizId, workspaceId, snapshot.settings);

  // O conteúdo publicado é legível por `anon`; remove segredos de webhook.
  const publishedContent = {
    steps: snapshot.steps,
    widgets: snapshot.widgets,
    design: snapshot.design,
    flowLayout: stripWebhookSecretsFromFlowLayout(snapshot.flowLayout),
    variables: snapshot.variables,
    settings: snapshot.settings,
  } as unknown as Json;

  const { error } = await supabase
    .from("quizzes")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_content: publishedContent,
    })
    .eq("id", quizId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}
