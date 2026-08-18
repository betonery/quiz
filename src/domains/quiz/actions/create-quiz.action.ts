"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { createQuizSchema } from "@/domains/quiz/schemas/create-quiz.schema";
import { createQuiz } from "@/domains/quiz/services/quiz.service";
import { assertCanCreateQuiz } from "@/domains/billing/services/subscription.service";
import type { QuizActionResult } from "@/domains/quiz/types/quiz.types";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export async function createQuizAction(
  workspaceSlug: string,
  data: unknown,
): Promise<QuizActionResult> {
  const parsed = createQuizSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

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
    await assertCanCreateQuiz(workspace.id);
    const quiz = await createQuiz(
      workspace.id,
      user.id,
      parsed.data.title,
      parsed.data.folderId ?? null,
    );
    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.quizzes(workspaceSlug));
    return { success: true, quizId: quiz.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível criar o funil",
    };
  }
}
