"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import type {
  BuilderActionResult,
  BuilderSnapshot,
} from "@/domains/quiz/types/builder.types";
import { saveQuizBuilder } from "@/domains/quiz/services/quiz-builder.service";
import { saveDesignSettings } from "@/domains/quiz/services/quiz-design.service";
import { saveFlowLayout } from "@/domains/quiz/services/quiz-flow.service";
import { saveQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import { saveQuizSettings } from "@/domains/quiz/services/quiz-settings.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export async function saveBuilderAction(
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
    await saveQuizBuilder(
      quizId,
      workspace.id,
      snapshot.steps,
      snapshot.widgets,
    );
    await saveDesignSettings(quizId, workspace.id, snapshot.design);
    await saveFlowLayout(quizId, workspace.id, snapshot.flowLayout);
    await saveQuizVariables(quizId, workspace.id, snapshot.variables);
    await saveQuizSettings(quizId, workspace.id, snapshot.settings);
    revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao salvar o funil",
    };
  }
}
