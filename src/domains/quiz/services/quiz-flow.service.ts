import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import type {
  FlowLayout,
  WebhookFunctionConfig,
} from "@/domains/quiz/types/flow.types";
import { parseFlowLayout } from "@/domains/quiz/utils/flow-layout.utils";
import type { Json } from "@/types/database.types";

export async function loadFlowLayout(quizId: string): Promise<FlowLayout> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("flow_layout")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data) {
    return parseFlowLayout(null);
  }

  return parseFlowLayout(data.flow_layout);
}

/**
 * Lê a configuração autoritativa (com URL/token) de um nó de webhook
 * diretamente da coluna `flow_layout`, usando service role.
 *
 * Os segredos do webhook NÃO são expostos via `published_content`/props do
 * player; a chamada server-side os recupera aqui. O `quizId` deve ter sido
 * previamente autorizado pelo chamador (quiz publicado ou prévia de membro).
 */
export async function getAuthoritativeWebhookConfig(
  quizId: string,
  functionId: string,
): Promise<WebhookFunctionConfig | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("quizzes")
    .select("flow_layout")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const flowLayout = parseFlowLayout(data.flow_layout);
  const node = flowLayout.functionNodes.find(
    (fn) => fn.id === functionId && fn.type === "webhook",
  );

  if (!node || node.type !== "webhook" || !node.config) {
    return null;
  }

  return node.config as WebhookFunctionConfig;
}

export async function saveFlowLayout(
  quizId: string,
  workspaceId: string,
  flowLayout: FlowLayout,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ flow_layout: flowLayout as unknown as Json })
    .eq("id", quizId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }
}
