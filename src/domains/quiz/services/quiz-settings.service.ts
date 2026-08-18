import { parseQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";
import type { QuizSettings } from "@/domains/quiz/types/quiz-settings.types";
import { createClient } from "@/services/supabase/server";
import type { Json } from "@/types/database.types";

export async function loadQuizSettings(quizId: string): Promise<QuizSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("settings")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data) {
    return parseQuizSettings(null);
  }

  return parseQuizSettings(data.settings);
}

export async function saveQuizSettings(
  quizId: string,
  workspaceId: string,
  settings: QuizSettings,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ settings: settings as unknown as Json })
    .eq("id", quizId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateQuizSlug(
  quizId: string,
  workspaceId: string,
  slug: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ slug })
    .eq("id", quizId)
    .eq("workspace_id", workspaceId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este slug já está em uso");
    }
    throw new Error(error.message);
  }
}

export async function isQuizSlugAvailable(
  slug: string,
  excludeQuizId?: string,
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase.from("quizzes").select("id").eq("slug", slug);

  if (excludeQuizId) {
    query = query.neq("id", excludeQuizId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return !data;
}
