import { createClient } from "@/services/supabase/server";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { parseDesignSettings } from "@/domains/quiz/utils/design-settings.utils";
import type { Json } from "@/types/database.types";

export async function loadDesignSettings(
  quizId: string,
): Promise<QuizDesignSettings> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("design_settings")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data) {
    return parseDesignSettings(null);
  }

  return parseDesignSettings(data.design_settings);
}

export async function saveDesignSettings(
  quizId: string,
  workspaceId: string,
  design: QuizDesignSettings,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ design_settings: design as unknown as Json })
    .eq("id", quizId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}
