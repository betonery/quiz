import { createClient } from "@/services/supabase/server";
import { getQuizFolderById } from "@/domains/quiz/services/quiz-folder.service";
import {
  bootstrapFirstStep,
  loadQuizBuilder,
  saveQuizBuilder,
} from "@/domains/quiz/services/quiz-builder.service";
import type { Quiz, QuizStatus } from "@/domains/quiz/types/quiz.types";
import { generateQuizSlug } from "@/domains/quiz/utils/quiz-slug";
import { generateId } from "@/domains/quiz/utils/generate-id";

const QUIZ_LIST_COLUMNS =
  "id, workspace_id, folder_id, title, slug, status, created_by, created_at, updated_at, published_at" as const;

function mapQuiz(row: {
  id: string;
  workspace_id: string;
  folder_id?: string | null;
  title: string;
  slug: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}): Quiz {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    folder_id: row.folder_id ?? null,
    title: row.title,
    slug: row.slug,
    status: row.status as QuizStatus,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at ?? null,
  };
}

export async function listQuizzesByWorkspaceId(
  workspaceId: string,
): Promise<Quiz[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select(QUIZ_LIST_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[listQuizzesByWorkspaceId]", error.message);
    return [];
  }

  return (data ?? []).map(mapQuiz);
}

export async function createQuiz(
  workspaceId: string,
  userId: string,
  title = "Funil sem título",
  folderId: string | null = null,
): Promise<Quiz> {
  const supabase = await createClient();
  const slug = generateQuizSlug(title);

  if (folderId) {
    const folder = await getQuizFolderById(workspaceId, folderId);
    if (!folder) {
      throw new Error("Pasta não encontrada");
    }
  }

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      workspace_id: workspaceId,
      title,
      slug,
      status: "draft",
      created_by: userId,
      folder_id: folderId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível criar o funil");
  }

  await bootstrapFirstStep(data.id, workspaceId);

  return mapQuiz(data);
}

export async function getQuizById(
  workspaceId: string,
  quizId: string,
): Promise<Quiz | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapQuiz(data);
}

export async function duplicateQuiz(
  workspaceId: string,
  userId: string,
  quizId: string,
): Promise<Quiz> {
  const original = await getQuizById(workspaceId, quizId);

  if (!original) {
    throw new Error("Funil não encontrado");
  }

  const copy = await createQuiz(
    workspaceId,
    userId,
    `${original.title} (cópia)`,
    original.folder_id,
  );

  const { steps, widgets } = await loadQuizBuilder(quizId);

  if (steps.length === 0) {
    return copy;
  }

  const stepIdMap = new Map<string, string>();
  const newSteps = steps.map((step) => {
    const newId = generateId();
    stepIdMap.set(step.id, newId);
    return { ...step, id: newId, quizId: copy.id, workspaceId };
  });

  const newWidgets = widgets.map((widget) => ({
    ...widget,
    id: generateId(),
    stepId: stepIdMap.get(widget.stepId) ?? widget.stepId,
    workspaceId,
    config: { ...widget.config },
  }));

  await saveQuizBuilder(copy.id, workspaceId, newSteps, newWidgets);

  return copy;
}

export async function deleteQuiz(
  workspaceId: string,
  quizId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", quizId);

  if (error) {
    throw new Error(error.message);
  }
}
