"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { duplicateQuiz } from "@/domains/quiz/services/quiz.service";
import type { QuizActionResult } from "@/domains/quiz/types/quiz.types";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export async function duplicateQuizAction(
  workspaceSlug: string,
  quizId: string,
): Promise<QuizActionResult> {
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
    return { success: false, error: "Acesso negado ao workspace" };
  }

  try {
    const quiz = await duplicateQuiz(workspace.id, user.id, quizId);
    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.quizzes(workspaceSlug));
    return { success: true, quizId: quiz.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível duplicar o funil",
    };
  }
}
