"use server";

import { getQuizShareSettings } from "@/domains/quiz/services/quiz-share.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import type { QuizShareSettings } from "@/domains/quiz/types/quiz-share.types";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export async function getQuizShareSettingsAction(
  workspaceSlug: string,
  quizId: string,
): Promise<
  { success: true; data: QuizShareSettings } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuário não autenticado" };
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    return { success: false, error: "Workspace não encontrado" };
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) {
    return { success: false, error: "Acesso negado" };
  }

  const quiz = await getQuizById(workspace.id, quizId);
  if (!quiz) {
    return { success: false, error: "Funil não encontrado" };
  }

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";

  const data = await getQuizShareSettings(quizId, workspace.id, appOrigin);
  return { success: true, data };
}
