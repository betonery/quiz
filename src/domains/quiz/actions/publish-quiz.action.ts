"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ROUTES } from "@/constants/routes";
import type {
  BuilderActionResult,
  BuilderSnapshot,
} from "@/domains/quiz/types/builder.types";
import { publishQuiz } from "@/domains/quiz/services/quiz-publish.service";
import { publishedQuizCacheTag } from "@/domains/quiz/services/quiz-public.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export async function publishQuizAction(
  workspaceSlug: string,
  quizId: string,
  snapshot: BuilderSnapshot,
): Promise<BuilderActionResult> {
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

  try {
    await publishQuiz(quizId, workspace.id, snapshot);
    revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
    revalidatePath(ROUTES.publicQuiz(quiz.slug));
    revalidateTag(publishedQuizCacheTag(quiz.slug));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao publicar o funil",
    };
  }
}
