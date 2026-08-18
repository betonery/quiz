"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import {
  disableQuizShare,
  enableQuizShare,
  refreshQuizShareSnapshot,
  regenerateQuizShareToken,
} from "@/domains/quiz/services/quiz-share.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";
import { z } from "zod";

const updateQuizShareSchema = z.object({
  action: z.enum(["enable", "disable", "refresh", "regenerate"]),
});

export type UpdateQuizShareResult =
  | { success: true; shareToken?: string; enabled: boolean }
  | { success: false; error: string };

export async function updateQuizShareAction(
  workspaceSlug: string,
  quizId: string,
  input: unknown,
): Promise<UpdateQuizShareResult> {
  const parsed = updateQuizShareSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Ação inválida" };
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
    return { success: false, error: "Acesso negado" };
  }

  const quiz = await getQuizById(workspace.id, quizId);
  if (!quiz) {
    return { success: false, error: "Funil não encontrado" };
  }

  try {
    switch (parsed.data.action) {
      case "enable": {
        const link = await enableQuizShare(quizId, workspace.id, user.id);
        revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
        return {
          success: true,
          enabled: true,
          shareToken: link.shareToken,
        };
      }
      case "disable": {
        await disableQuizShare(quizId);
        revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
        return { success: true, enabled: false };
      }
      case "refresh": {
        await refreshQuizShareSnapshot(quizId, workspace.id);
        revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
        return { success: true, enabled: true };
      }
      case "regenerate": {
        const link = await regenerateQuizShareToken(
          quizId,
          workspace.id,
          user.id,
        );
        revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
        return {
          success: true,
          enabled: true,
          shareToken: link.shareToken,
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o compartilhamento",
    };
  }
}
