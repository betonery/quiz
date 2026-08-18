"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { AUDIT_ACTIONS } from "@/domains/admin/constants/admin.constants";
import { quizIdSchema } from "@/domains/admin/schemas/admin-workspace.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import {
  deleteQuiz,
  getQuizRow,
  unpublishQuiz,
} from "@/domains/admin/services/admin-quizzes.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";
import { publishedQuizCacheTag } from "@/domains/quiz/services/quiz-public.service";

function revalidateQuiz(slug: string, workspaceId: string) {
  revalidatePath(ROUTES.admin.quizzes);
  revalidatePath(ROUTES.admin.workspace(workspaceId));
  revalidatePath(ROUTES.admin.root);
  revalidatePath(ROUTES.publicQuiz(slug));
  revalidateTag(publishedQuizCacheTag(slug));
}

/** Moderação: tira o funil do ar mantendo o rascunho intacto. */
export async function unpublishQuizAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = quizIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const quiz = await getQuizRow(parsed.data.quizId);
  if (!quiz) return failure("Funil não encontrado.");

  if (quiz.status !== "published") {
    return failure("Este funil não está publicado.");
  }

  const unpublished = await unpublishQuiz(quiz.id);
  if (!unpublished) return failure("Não foi possível despublicar o funil.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.quizUnpublished,
    entityType: "quiz",
    entityId: quiz.id,
    entityLabel: quiz.slug,
    summary: `Despublicou o funil "${quiz.title}"`,
    metadata: { workspaceId: quiz.workspace_id, slug: quiz.slug },
  });

  revalidateQuiz(quiz.slug, quiz.workspace_id);
  return { success: true };
}

export async function deleteQuizAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = quizIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const quiz = await getQuizRow(parsed.data.quizId);
  if (!quiz) return failure("Funil não encontrado.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.quizDeleted,
    entityType: "quiz",
    entityId: quiz.id,
    entityLabel: quiz.slug,
    summary: `Excluiu o funil "${quiz.title}"`,
    metadata: { workspaceId: quiz.workspace_id, slug: quiz.slug },
  });

  const deleted = await deleteQuiz(quiz.id);
  if (!deleted) return failure("Não foi possível excluir o funil.");

  revalidateQuiz(quiz.slug, quiz.workspace_id);
  return { success: true };
}
