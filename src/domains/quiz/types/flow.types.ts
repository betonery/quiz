import { z } from "zod";

export const flowFunctionTypeSchema = z.enum([
  "create_score",
  "add_score",
  "set_variable",
  "link",
  "condition",
  "webhook",
]);
export type FlowFunctionType = z.infer<typeof flowFunctionTypeSchema>;

/** Placeholder neutro até o usuário configurar o destino no editor. */
export const DEFAULT_LINK_URL = "https://example.com";

export const setVariableFunctionConfigSchema = z.object({
  variableKey: z.string(),
  expression: z.string(),
});

export type SetVariableFunctionConfig = z.infer<
  typeof setVariableFunctionConfigSchema
>;

export const linkFunctionConfigSchema = z.object({
  url: z.string().min(1),
  openInNewWindow: z.boolean().optional(),
});

export type LinkFunctionConfig = z.infer<typeof linkFunctionConfigSchema>;

export const conditionOperatorSchema = z.enum([
  "eq",
  "neq",
  "contains",
  "not_contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "defined",
  "empty",
  "starts_with",
  "ends_with",
  "regex",
  "not_regex",
]);

export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;

export const conditionComparisonSchema = z.object({
  id: z.string(),
  variableKey: z.string(),
  operator: conditionOperatorSchema,
  value: z.string().optional(),
  joinWithPrevious: z.enum(["and", "or"]).optional(),
});

export type ConditionComparison = z.infer<typeof conditionComparisonSchema>;

export const conditionBranchSchema = z.object({
  id: z.string(),
  comparisons: z.array(conditionComparisonSchema),
});

export type ConditionBranch = z.infer<typeof conditionBranchSchema>;

export const conditionFunctionConfigSchema = z.object({
  branches: z.array(conditionBranchSchema),
});

export type ConditionFunctionConfig = z.infer<
  typeof conditionFunctionConfigSchema
>;

export const webhookMethodSchema = z.enum(["POST", "GET"]);
export type WebhookMethod = z.infer<typeof webhookMethodSchema>;

export const webhookFunctionConfigSchema = z.object({
  url: z.string(),
  method: webhookMethodSchema.default("POST"),
  token: z.string().optional(),
  variableKeys: z.array(z.string()),
});

export type WebhookFunctionConfig = z.infer<typeof webhookFunctionConfigSchema>;

export type FlowFunctionConfig =
  | SetVariableFunctionConfig
  | LinkFunctionConfig
  | ConditionFunctionConfig
  | WebhookFunctionConfig;

/** Parseia config pelo `type` do nó — evita union Zod tratar webhook como link (ambos têm `url`). */
export function parseFlowFunctionConfig(
  type: FlowFunctionType,
  raw: unknown,
): FlowFunctionConfig | undefined {
  if (raw == null) return undefined;

  switch (type) {
    case "set_variable": {
      const parsed = setVariableFunctionConfigSchema.safeParse(raw);
      return parsed.success ? parsed.data : undefined;
    }
    case "link": {
      const parsed = linkFunctionConfigSchema.safeParse(raw);
      return parsed.success ? parsed.data : undefined;
    }
    case "condition": {
      const parsed = conditionFunctionConfigSchema.safeParse(raw);
      return parsed.success ? parsed.data : undefined;
    }
    case "webhook": {
      const parsed = webhookFunctionConfigSchema.safeParse(raw);
      if (parsed.success) return parsed.data;
      if (typeof raw === "object") {
        const record = raw as Record<string, unknown>;
        return {
          url: typeof record.url === "string" ? record.url : "",
          method: record.method === "GET" ? "GET" : "POST",
          token: typeof record.token === "string" ? record.token : undefined,
          variableKeys: Array.isArray(record.variableKeys)
            ? record.variableKeys.filter(
                (key): key is string => typeof key === "string",
              )
            : [],
        };
      }
      return { url: "", method: "POST", variableKeys: [] };
    }
    default:
      return undefined;
  }
}

export const flowFunctionNodeSchema = z
  .object({
    id: z.string(),
    type: flowFunctionTypeSchema,
    label: z.string(),
    config: z.unknown().optional(),
  })
  .transform((node) => ({
    id: node.id,
    type: node.type,
    label: node.label,
    config: parseFlowFunctionConfig(node.type, node.config),
  }));

export type FlowFunctionNode = {
  id: string;
  type: FlowFunctionType;
  label: string;
  config?: FlowFunctionConfig;
};

export const flowVisualEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string(),
  target: z.string(),
  targetHandle: z.string().optional(),
});

export type FlowVisualEdge = z.infer<typeof flowVisualEdgeSchema>;

export const flowLayoutSchema = z.object({
  nodePositions: z.record(
    z.string(),
    z.object({ x: z.number(), y: z.number() }),
  ),
  functionNodes: z.array(flowFunctionNodeSchema),
  visualEdges: z.array(flowVisualEdgeSchema),
});

export type FlowLayout = {
  nodePositions: Record<string, { x: number; y: number }>;
  functionNodes: FlowFunctionNode[];
  visualEdges: FlowVisualEdge[];
};

export const defaultFlowLayout: FlowLayout = {
  nodePositions: {},
  functionNodes: [],
  visualEdges: [],
};

export const FLOW_FUNCTION_LABELS: Record<FlowFunctionType, string> = {
  create_score: "Criar Score",
  add_score: "Adicionar Score",
  set_variable: "Variável",
  link: "Link",
  condition: "Condições",
  webhook: "Webhook",
};

export const FLOW_START_NODE_ID = "start";

export const FLOW_CONDITION_ELSE_HANDLE = "cond-else";

export function conditionHandleId(branchId: string): string {
  return `cond-${branchId}`;
}

export function parseConditionHandle(
  handleId: string,
): { branchId: string } | "else" | null {
  if (handleId === FLOW_CONDITION_ELSE_HANDLE) return "else";
  if (!handleId.startsWith("cond-")) return null;
  const branchId = handleId.slice(5);
  if (!branchId) return null;
  return { branchId };
}

/** Handles padrão para nós de função e etapa (React Flow usa null sem id explícito). */
export const FLOW_FUNCTION_SOURCE_HANDLE = "fn-out";
export const FLOW_FUNCTION_TARGET_HANDLE = "fn-in";
export const FLOW_STEP_TARGET_HANDLE = "step-in";

/** Normaliza handles legados (`default`, vazio) para ids estáveis. */
export function normalizeFlowSourceHandle(
  handle: string | null | undefined,
  sourceNodeId: string,
): string {
  if (handle && handle !== "default") return handle;
  if (sourceNodeId.startsWith("fn-")) return FLOW_FUNCTION_SOURCE_HANDLE;
  return handle ?? "";
}

export function normalizeFlowTargetHandle(
  handle: string | null | undefined,
  targetNodeId: string,
): string | undefined {
  if (handle && handle !== "default") return handle;
  if (targetNodeId.startsWith("step-")) return FLOW_STEP_TARGET_HANDLE;
  if (targetNodeId.startsWith("fn-")) return FLOW_FUNCTION_TARGET_HANDLE;
  return handle ?? undefined;
}

/** Largura fixa dos nós de etapa no fluxo. */
export const FLOW_STEP_NODE_WIDTH = 220;

/** Painel flutuante do editor de etapa. */
export const FLOW_EDITOR_LEFT_PANEL_WIDTH = 420;
export const FLOW_EDITOR_PHONE_MAX_WIDTH = 370;
/** Padding horizontal da coluna do preview (4px de cada lado). */
export const FLOW_EDITOR_PHONE_AREA_PADDING = 8;
export const FLOW_EDITOR_DRAWER_CONTENT_WIDTH =
  FLOW_EDITOR_LEFT_PANEL_WIDTH +
  FLOW_EDITOR_PHONE_MAX_WIDTH +
  FLOW_EDITOR_PHONE_AREA_PADDING;
export const FLOW_EDITOR_DRAWER_MARGIN = 8;
export const FLOW_EDITOR_DRAWER_WIDTH =
  FLOW_EDITOR_DRAWER_CONTENT_WIDTH + FLOW_EDITOR_DRAWER_MARGIN;

export function flowStepNodeId(stepId: string): string {
  return `step-${stepId}`;
}

export function flowFunctionNodeId(id: string): string {
  return `fn-${id}`;
}

export function parseStepIdFromFlowNode(nodeId: string): string | null {
  if (!nodeId.startsWith("step-")) return null;
  return nodeId.slice(5);
}

export function parseFunctionIdFromFlowNode(nodeId: string): string | null {
  if (!nodeId.startsWith("fn-")) return null;
  return nodeId.slice(3);
}

export function optionHandleId(widgetId: string, optionId: string): string {
  return `opt-${widgetId}::${optionId}`;
}

export function buttonHandleId(widgetId: string): string {
  return `btn-${widgetId}`;
}

export function parseOptionHandle(
  handleId: string,
): { widgetId: string; optionId: string } | null {
  if (!handleId.startsWith("opt-")) return null;
  const rest = handleId.slice(4);
  const sep = rest.indexOf("::");
  if (sep === -1) return null;
  return {
    widgetId: rest.slice(0, sep),
    optionId: rest.slice(sep + 2),
  };
}

export function parseButtonHandle(handleId: string): string | null {
  if (!handleId.startsWith("btn-")) return null;
  return handleId.slice(4);
}

export function redirectHandleId(widgetId: string): string {
  return `rdt-${widgetId}`;
}

export function parseRedirectHandle(handleId: string): string | null {
  if (!handleId.startsWith("rdt-")) return null;
  return handleId.slice(4);
}

export function countdownHandleId(widgetId: string): string {
  return `cnt-${widgetId}`;
}

export function parseCountdownHandle(handleId: string): string | null {
  if (!handleId.startsWith("cnt-")) return null;
  return handleId.slice(4);
}
