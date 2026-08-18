import type {
  ButtonWidgetConfig,
  OptionsWidgetConfig,
  QuizWidget,
} from "@/domains/quiz/types/builder.types";
import type {
  ConditionFunctionConfig,
  FlowFunctionNode,
  FlowLayout,
} from "@/domains/quiz/types/flow.types";
import {
  DEFAULT_LINK_URL,
  FLOW_FUNCTION_SOURCE_HANDLE,
  flowFunctionNodeId,
  flowStepNodeId,
  normalizeFlowSourceHandle,
  parseButtonHandle,
  parseOptionHandle,
  parseStepIdFromFlowNode,
} from "@/domains/quiz/types/flow.types";
import { resolveConditionHandle } from "@/domains/quiz/utils/condition-evaluation.utils";
import { evaluateVariableExpression } from "@/domains/quiz/utils/variable-expression.utils";
import { resolveLinkUrl } from "@/domains/quiz/utils/variable-template.utils";

export type NavigationPathResult = {
  targetStepId: string | null;
  functionNodes: FlowFunctionNode[];
  redirectUrl?: string | null;
  redirectOpenInNewWindow?: boolean;
};

function isFunctionFlowNode(nodeId: string): boolean {
  return nodeId.startsWith("fn-");
}

function getWidgetDestinationStepId(
  widgets: QuizWidget[],
  sourceStepId: string,
  sourceHandle: string,
): string | null {
  if (sourceHandle.startsWith("btn-")) {
    const widgetId = parseButtonHandle(sourceHandle);
    if (!widgetId) return null;
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget || widget.type !== "button") return null;
    return (widget.config as ButtonWidgetConfig).destinationStepId;
  }

  if (sourceHandle.startsWith("opt-")) {
    const parsed = parseOptionHandle(sourceHandle);
    if (!parsed) return null;
    const widget = widgets.find((w) => w.id === parsed.widgetId);
    if (!widget || widget.type !== "options") return null;
    const config = widget.config as OptionsWidgetConfig;
    const option = config.options.find((o) => o.id === parsed.optionId);
    return option?.destinationStepId ?? null;
  }

  return null;
}

function getVisualEdgeTarget(
  flowLayout: FlowLayout,
  sourceNodeId: string,
  sourceHandle: string,
): string | null {
  const normalizedSource = normalizeFlowSourceHandle(
    sourceHandle,
    sourceNodeId,
  );
  const edge = flowLayout.visualEdges.find((item) => {
    if (item.source !== sourceNodeId) return false;
    return (
      normalizeFlowSourceHandle(item.sourceHandle, item.source) ===
      normalizedSource
    );
  });
  return edge?.target ?? null;
}

function applySetVariable(
  fn: FlowFunctionNode,
  variables: Record<string, unknown>,
): Record<string, unknown> {
  if (
    fn.type !== "set_variable" ||
    !fn.config ||
    !("variableKey" in fn.config) ||
    !fn.config.variableKey
  ) {
    return variables;
  }

  return {
    ...variables,
    [fn.config.variableKey]: evaluateVariableExpression(
      fn.config.expression ?? "",
      variables,
    ),
  };
}

function walkFunctionChain(
  flowLayout: FlowLayout,
  startNodeId: string,
  variables: Record<string, unknown>,
): NavigationPathResult {
  const functionNodes: FlowFunctionNode[] = [];
  let currentNodeId: string | null = startNodeId;
  let currentVariables = { ...variables };
  const visited = new Set<string>();

  while (currentNodeId && isFunctionFlowNode(currentNodeId)) {
    if (visited.has(currentNodeId)) break;
    visited.add(currentNodeId);

    const fn = flowLayout.functionNodes.find(
      (node) => flowFunctionNodeId(node.id) === currentNodeId,
    );
    if (!fn) break;

    functionNodes.push(fn);

    if (fn.type === "link") {
      const url =
        fn.config && "url" in fn.config && fn.config.url
          ? fn.config.url
          : DEFAULT_LINK_URL;
      const openInNewWindow =
        fn.config &&
        "openInNewWindow" in fn.config &&
        fn.config.openInNewWindow === true;
      return {
        targetStepId: null,
        functionNodes,
        redirectUrl: resolveLinkUrl(url, currentVariables),
        redirectOpenInNewWindow: openInNewWindow,
      };
    }

    if (fn.type === "set_variable") {
      currentVariables = applySetVariable(fn, currentVariables);
    }

    let nextSourceHandle = FLOW_FUNCTION_SOURCE_HANDLE;

    if (fn.type === "condition" && fn.config && "branches" in fn.config) {
      nextSourceHandle = resolveConditionHandle(
        fn.config as ConditionFunctionConfig,
        currentVariables,
      );
    }

    const outEdge = flowLayout.visualEdges.find(
      (edge) =>
        edge.source === currentNodeId &&
        normalizeFlowSourceHandle(edge.sourceHandle, edge.source) ===
          nextSourceHandle,
    );
    currentNodeId = outEdge?.target ?? null;
  }

  const targetStepId = currentNodeId
    ? parseStepIdFromFlowNode(currentNodeId)
    : null;

  return { targetStepId, functionNodes };
}

export function resolveNavigationPath(params: {
  sourceStepId: string;
  sourceHandle: string;
  widgets: QuizWidget[];
  flowLayout: FlowLayout;
  variables?: Record<string, unknown>;
}): NavigationPathResult {
  const {
    sourceStepId,
    sourceHandle,
    widgets,
    flowLayout,
    variables = {},
  } = params;
  const sourceNodeId = flowStepNodeId(sourceStepId);

  const directStepId = getWidgetDestinationStepId(
    widgets,
    sourceStepId,
    sourceHandle,
  );
  const visualTarget = getVisualEdgeTarget(
    flowLayout,
    sourceNodeId,
    sourceHandle,
  );

  if (directStepId) {
    return { targetStepId: directStepId, functionNodes: [] };
  }

  if (!visualTarget) {
    return { targetStepId: null, functionNodes: [] };
  }

  if (!isFunctionFlowNode(visualTarget)) {
    return {
      targetStepId: parseStepIdFromFlowNode(visualTarget),
      functionNodes: [],
    };
  }

  return walkFunctionChain(flowLayout, visualTarget, variables);
}
