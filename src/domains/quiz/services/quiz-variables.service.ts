import type { QuizVariable } from "@/domains/quiz/types/builder.types";
import { parseQuizVariables } from "@/domains/quiz/utils/variable-registry.utils";
import { createClient } from "@/services/supabase/server";
import type { Json } from "@/types/database.types";

export async function loadQuizVariables(
  quizId: string,
): Promise<QuizVariable[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("variables")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data) {
    return [];
  }

  return parseQuizVariables(data.variables);
}

export async function saveQuizVariables(
  quizId: string,
  workspaceId: string,
  variables: QuizVariable[],
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ variables: variables as unknown as Json })
    .eq("id", quizId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}
