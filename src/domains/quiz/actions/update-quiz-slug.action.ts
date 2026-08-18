"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { publishedQuizCacheTag } from "@/domains/quiz/services/quiz-public.service";
import {
  checkQuizSlugSchema,
  updateQuizSlugSchema,
} from "@/domains/quiz/schemas/quiz-slug.schema";
import {
  isQuizSlugAvailable,
  updateQuizSlug,
} from "@/domains/quiz/services/quiz-settings.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import type { QuizActionResult } from "@/domains/quiz/types/quiz.types";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export async function checkQuizSlugAction(
  slug: string,
  excludeQuizId?: string,
): Promise<{ available: boolean; error?: string }> {
  const parsed = checkQuizSlugSchema.safeParse({ slug, excludeQuizId });
  if (!parsed.success) {
    return {
      available: false,
      error: parsed.error.issues[0]?.message ?? "Slug inválido",
    };
  }

  try {
    const available = await isQuizSlugAvailable(
      parsed.data.slug,
      parsed.data.excludeQuizId,
    );
    return { available };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Erro ao verificar slug",
    };
  }
}

export async function updateQuizSlugAction(
  workspaceSlug: string,
  quizId: string,
  slug: string,
  previousSlug: string,
): Promise<QuizActionResult> {
  const parsed = updateQuizSlugSchema.safeParse({
    quizId,
    workspaceSlug,
    slug,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Slug inválido",
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
    return { success: false, error: "Acesso negado" };
  }

  const quiz = await getQuizById(workspace.id, quizId);
  if (!quiz) {
    return { success: false, error: "Funil não encontrado" };
  }

  if (quiz.slug === parsed.data.slug) {
    return { success: true, quizId };
  }

  try {
    const available = await isQuizSlugAvailable(parsed.data.slug, quizId);
    if (!available) {
      return { success: false, error: "Este slug já está em uso" };
    }

    await updateQuizSlug(quizId, workspace.id, parsed.data.slug);

    revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
    revalidatePath(ROUTES.publicQuiz(previousSlug));
    revalidatePath(ROUTES.publicQuiz(parsed.data.slug));
    revalidateTag(publishedQuizCacheTag(previousSlug));
    revalidateTag(publishedQuizCacheTag(parsed.data.slug));

    return { success: true, quizId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao atualizar slug",
    };
  }
}
