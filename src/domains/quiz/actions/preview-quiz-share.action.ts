"use server";

import {
  INVALID_SHARE_MESSAGE,
  getSharePreviewByToken,
} from "@/domains/quiz/services/quiz-share.service";
import { extractShareTokenFromInput } from "@/domains/quiz/utils/quiz-share-export.utils";
import type { QuizSharePreview } from "@/domains/quiz/types/quiz-share.types";
import { createClient } from "@/services/supabase/server";

export async function previewQuizShareAction(
  input: unknown,
): Promise<
  { success: true; data: QuizSharePreview } | { success: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuário não autenticado" };
  }

  const raw = typeof input === "string" ? input : "";
  const token = extractShareTokenFromInput(raw);
  if (!token) {
    return { success: false, error: INVALID_SHARE_MESSAGE };
  }

  const preview = await getSharePreviewByToken(token);
  if (!preview) {
    return { success: false, error: INVALID_SHARE_MESSAGE };
  }

  return { success: true, data: preview };
}

export async function previewQuizShareByTokenAction(
  token: string,
): Promise<
  { success: true; data: QuizSharePreview } | { success: false; error: string }
> {
  return previewQuizShareAction(token);
}
