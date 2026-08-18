"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import {
  createQuizFolderSchema,
  moveQuizToFolderSchema,
  renameQuizFolderSchema,
} from "@/domains/quiz/schemas/quiz-folder.schema";
import {
  createQuizFolder,
  deleteQuizFolder,
  moveQuizToFolder,
  renameQuizFolder,
} from "@/domains/quiz/services/quiz-folder.service";
import type { QuizFolderActionResult } from "@/domains/quiz/types/quiz-folder.types";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

function revalidateDashboard(workspaceSlug: string) {
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.quizzes(workspaceSlug));
}

async function assertWorkspaceMember(workspaceSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    throw new Error("Workspace não encontrado");
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) {
    throw new Error("Acesso negado ao workspace");
  }

  return { user, workspace };
}

export async function createQuizFolderAction(
  workspaceSlug: string,
  data: unknown,
): Promise<QuizFolderActionResult> {
  const parsed = createQuizFolderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const { user, workspace } = await assertWorkspaceMember(workspaceSlug);
    const folder = await createQuizFolder(
      workspace.id,
      user.id,
      parsed.data.name,
    );
    revalidateDashboard(workspaceSlug);
    return { success: true, folderId: folder.id };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível criar a pasta",
    };
  }
}

export async function renameQuizFolderAction(
  workspaceSlug: string,
  folderId: string,
  data: unknown,
): Promise<QuizFolderActionResult> {
  const parsed = renameQuizFolderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const { workspace } = await assertWorkspaceMember(workspaceSlug);
    await renameQuizFolder(workspace.id, folderId, parsed.data.name);
    revalidateDashboard(workspaceSlug);
    return { success: true, folderId };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível renomear a pasta",
    };
  }
}

export async function deleteQuizFolderAction(
  workspaceSlug: string,
  folderId: string,
): Promise<QuizFolderActionResult> {
  try {
    const { workspace } = await assertWorkspaceMember(workspaceSlug);
    await deleteQuizFolder(workspace.id, folderId);
    revalidateDashboard(workspaceSlug);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a pasta",
    };
  }
}

export async function moveQuizToFolderAction(
  workspaceSlug: string,
  quizId: string,
  data: unknown,
): Promise<QuizFolderActionResult> {
  const parsed = moveQuizToFolderSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const { workspace } = await assertWorkspaceMember(workspaceSlug);
    await moveQuizToFolder(workspace.id, quizId, parsed.data.folderId);
    revalidateDashboard(workspaceSlug);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível mover o funil",
    };
  }
}
