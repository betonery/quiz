import type {
  FlowFunctionNode,
  FlowLayout,
  WebhookFunctionConfig,
} from "@/domains/quiz/types/flow.types";

/**
 * Remove segredos do webhook (token e URL) dos nós de função antes de
 * qualquer exposição pública: `published_content` (lido por `anon` via
 * PostgREST) e props enviadas ao player no navegador.
 *
 * O player só precisa de `id`, `type`, `method` e `variableKeys` para chamar
 * o endpoint interno `/api/q/[slug]/webhook`; a URL/token reais permanecem
 * apenas no servidor (coluna `flow_layout`, acessível somente via service role).
 */
export function stripWebhookSecretsFromFlowLayout(
  flowLayout: FlowLayout,
): FlowLayout {
  return {
    ...flowLayout,
    functionNodes: flowLayout.functionNodes.map(stripWebhookSecretsFromNode),
  };
}

function stripWebhookSecretsFromNode(node: FlowFunctionNode): FlowFunctionNode {
  if (node.type !== "webhook" || !node.config) {
    return node;
  }

  const config = node.config as WebhookFunctionConfig;
  return {
    ...node,
    config: {
      ...config,
      url: "",
      token: "",
    },
  };
}
