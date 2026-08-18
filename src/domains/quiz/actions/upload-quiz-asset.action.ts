"use server";

import type { BuilderActionResult } from "@/domains/quiz/types/builder.types";
import {
  MAX_QUIZ_ASSET_FILE_SIZE,
  MAX_QUIZ_ASSET_FILE_SIZE_LABEL,
  MAX_QUIZ_AUDIO_FILE_SIZE,
  MAX_QUIZ_AUDIO_FILE_SIZE_LABEL,
  QUIZ_ASSET_ALLOWED_TYPES,
  QUIZ_ASSET_SUBFOLDERS,
  QUIZ_AUDIO_ALLOWED_TYPES,
  type QuizAssetKind,
  type QuizAssetSubfolder,
} from "@/domains/quiz/constants/quiz-asset.constants";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export async function uploadQuizAssetAction(
  workspaceSlug: string,
  quizId: string,
  formData: FormData,
  subfolder: QuizAssetSubfolder = "logo",
  assetKind: QuizAssetKind = "image",
): Promise<BuilderActionResult & { filePath?: string }> {
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

  if (
    !(QUIZ_ASSET_SUBFOLDERS as readonly string[]).includes(subfolder) ||
    (assetKind !== "image" && assetKind !== "audio")
  ) {
    return { success: false, error: "Parâmetro de upload inválido" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Arquivo inválido" };
  }

  const allowedTypes: readonly string[] =
    assetKind === "audio" ? QUIZ_AUDIO_ALLOWED_TYPES : QUIZ_ASSET_ALLOWED_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Tipo de arquivo não suportado" };
  }

  const maxSize =
    assetKind === "audio" ? MAX_QUIZ_AUDIO_FILE_SIZE : MAX_QUIZ_ASSET_FILE_SIZE;
  const maxSizeLabel =
    assetKind === "audio"
      ? MAX_QUIZ_AUDIO_FILE_SIZE_LABEL
      : MAX_QUIZ_ASSET_FILE_SIZE_LABEL;

  if (file.size > maxSize) {
    return {
      success: false,
      error: `Arquivo muito grande (máx. ${maxSizeLabel})`,
    };
  }

  const rawExt =
    file.name.split(".").pop() ?? (assetKind === "audio" ? "mp3" : "png");
  // Sanitiza a extensão para evitar caracteres inesperados na chave do objeto.
  const ext = (
    rawExt.match(/[a-z0-9]+/i)?.[0] ?? (assetKind === "audio" ? "mp3" : "png")
  ).toLowerCase();
  const filePath = `${workspace.id}/${quizId}/${subfolder}/${Date.now()}.${ext}`;

  // Upload via service role após validar auth + membership no servidor.
  // O client SSR nem sempre propaga o JWT ao Storage API em server actions,
  // o que fazia o INSERT falhar na policy RLS (role anon / auth.uid() null).
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from("quiz-assets")
    .upload(filePath, file, { upsert: false, contentType: file.type });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, filePath };
}
