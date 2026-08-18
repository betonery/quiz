"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { assertCanCreateQuiz } from "@/domains/billing/services/subscription.service";
import {
  INVALID_SHARE_MESSAGE,
  applyBuilderSnapshot,
  cloneShareSnapshotForImport,
  getShareSnapshotByToken,
  recordShareImport,
} from "@/domains/quiz/services/quiz-share.service";
import { createQuiz } from "@/domains/quiz/services/quiz.service";
import type { QuizActionResult } from "@/domains/quiz/types/quiz.types";
import { extractShareTokenFromInput } from "@/domains/quiz/utils/quiz-share-export.utils";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";
import { z } from "zod";

const importRateLimit = new Map<
  string,
  { count: number; windowStart: number }
>();
const IMPORT_RATE_LIMIT = 10;
const IMPORT_RATE_WINDOW_MS = 60_000;

function checkImportRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = importRateLimit.get(userId);

  if (!entry || now - entry.windowStart > IMPORT_RATE_WINDOW_MS) {
    importRateLimit.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= IMPORT_RATE_LIMIT) {
    return false;
  }

  entry.count += 1;
  return true;
}

const importQuizFromShareSchema = z.object({
  shareInput: z.string().min(1, "Informe o link ou token de compartilhamento"),
  title: z.string().trim().min(1, "Nome do funil é obrigatório").max(120),
  folderId: z.string().uuid("Pasta inválida").nullable().optional(),
});

export async function importQuizFromShareAction(
  workspaceSlug: string,
  data: unknown,
): Promise<QuizActionResult> {
  const parsed = importQuizFromShareSchema.safeParse(data);
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

  if (!checkImportRateLimit(user.id)) {
    return {
      success: false,
      error: "Muitas importações em sequência. Tente novamente em instantes.",
    };
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    return { success: false, error: "Workspace não encontrado" };
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) {
    return { success: false, error: "Acesso negado" };
  }

  try {
    await assertCanCreateQuiz(workspace.id);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Limite de funis atingido",
    };
  }

  const token = extractShareTokenFromInput(parsed.data.shareInput);
  if (!token) {
    return { success: false, error: INVALID_SHARE_MESSAGE };
  }

  const snapshot = await getShareSnapshotByToken(token);
  if (!snapshot) {
    return { success: false, error: INVALID_SHARE_MESSAGE };
  }

  try {
    const quiz = await createQuiz(
      workspace.id,
      user.id,
      parsed.data.title,
      parsed.data.folderId ?? null,
    );
    const builderSnapshot = cloneShareSnapshotForImport(
      snapshot,
      quiz.id,
      workspace.id,
    );
    await applyBuilderSnapshot(quiz.id, workspace.id, builderSnapshot);
    await recordShareImport(token);

    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.quizzes(workspaceSlug));
    return { success: true, quizId: quiz.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível importar o funil",
    };
  }
}
