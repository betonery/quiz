"use server";

import type { WebhookFunctionConfig } from "@/domains/quiz/types/flow.types";
import type { WebhookDispatchResult } from "@/domains/quiz/utils/webhook-dispatch.utils";
import {
  buildSampleVariables,
  buildWebhookPayload,
  dispatchWebhookRequest,
  validateWebhookUrl,
} from "@/domains/quiz/utils/webhook-dispatch.utils";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import { loadQuizVariables } from "@/domains/quiz/services/quiz-variables.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export type TestWebhookFunctionResult =
  | { success: true; result: WebhookDispatchResult }
  | { success: false; error: string };

export async function testWebhookFunctionAction(
  workspaceSlug: string,
  quizId: string,
  functionId: string,
  config: WebhookFunctionConfig,
): Promise<TestWebhookFunctionResult> {
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
    return { success: false, error: "Sem permissão neste workspace" };
  }

  const quiz = await getQuizById(workspace.id, quizId);
  if (!quiz || quiz.workspace_id !== workspace.id) {
    return { success: false, error: "Funil não encontrado" };
  }

  const urlError = validateWebhookUrl(config.url, {
    allowLocalhost: process.env.NODE_ENV === "development",
  });
  if (urlError) {
    return { success: false, error: urlError };
  }

  const variables = await loadQuizVariables(quizId);
  const sampleVariables = buildSampleVariables(config.variableKeys, variables);
  const payload = buildWebhookPayload({
    event: "quiz.webhook.test",
    quizId,
    functionId,
    variableKeys: config.variableKeys,
    variables: sampleVariables,
  });

  const result = await dispatchWebhookRequest({
    url: config.url,
    method: config.method ?? "POST",
    token: config.token,
    payload: config.method === "GET" ? undefined : payload,
  });

  return { success: true, result };
}
