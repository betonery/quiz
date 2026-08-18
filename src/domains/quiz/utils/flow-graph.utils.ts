import dagre from "@dagrejs/dagre";
import type { Edge, Node } from "@xyflow/react";
import type {
  ButtonWidgetConfig,
  OptionsWidgetConfig,
  QuizStep,
  QuizWidget,
  RedirectWidgetConfig,
  CountdownWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import {
  DEFAULT_LINK_URL,
  FLOW_START_NODE_ID,
  FLOW_STEP_NODE_WIDTH,
  buttonHandleId,
  flowFunctionNodeId,
  flowStepNodeId,
  normalizeFlowSourceHandle,
  normalizeFlowTargetHandle,
  optionHandleId,
  parseConditionHandle,
  parseFunctionIdFromFlowNode,
  parseRedirectHandle,
  parseCountdownHandle,
  type ConditionBranch,
  type FlowLayout,
} from "@/domains/quiz/types/flow.types";
import { formatConditionSummary } from "@/domains/quiz/utils/condition-evaluation.utils";
import { hasTemplateVariables } from "@/domains/quiz/utils/variable-template.utils";

const FLOW_EDGE_INTERACTION_WIDTH = 24;

export type FlowStepNodeData = {
  step: QuizStep;
  widgets: QuizWidget[];
  design: QuizDesignSettings;
  stepIndex: number;
  totalSteps: number;
};

export type FlowFunctionNodeData = {
  functionId: string;
  type:
    | "create_score"
    | "add_score"
    | "set_variable"
    | "link"
    | "condition"
    | "webhook";
  label: string;
  linkUrl?: string;
  linkHasVariables?: boolean;
};

export type FlowConditionNodeData = {
  functionId: string;
  label: string;
  branches: ConditionBranch[];
};

export type FlowEdgeData = {
  label?: string;
  edgeKind: "navigation" | "implicit" | "visual" | "orphan";
  edgeId: string;
};

const STEP_NODE_WIDTH = FLOW_STEP_NODE_WIDTH;
const STEP_NODE_HEADER_HEIGHT = 40;
const STEP_NODE_PADDING = 24;
const STEP_NODE_ROW_HEIGHT = 32;
const STEP_NODE_LOGO_ROW_HEIGHT = 44;
const STEP_NODE_EMPTY_HEIGHT = 40;
const FUNCTION_NODE_WIDTH = 160;
const FUNCTION_NODE_HEIGHT = 48;
const CONDITION_NODE_WIDTH = FLOW_STEP_NODE_WIDTH;
const CONDITION_NODE_HEADER_HEIGHT = 40;
const CONDITION_NODE_ROW_HEIGHT = 32;
const CONDITION_NODE_PADDING = 20;
const CONDITION_NODE_EMPTY_HEIGHT = 36;
const START_NODE_WIDTH = 100;
const START_NODE_HEIGHT = 40;

function estimateStepNodeHeight(step: QuizStep, widgets: QuizWidget[]): number {
  let height = STEP_NODE_HEADER_HEIGHT + STEP_NODE_PADDING;

  if (step.settings.showLogo) height += STEP_NODE_LOGO_ROW_HEIGHT;
  if (step.settings.showProgress) height += STEP_NODE_ROW_HEIGHT;

  if (widgets.length === 0) {
    return height + STEP_NODE_EMPTY_HEIGHT;
  }

  for (const widget of widgets) {
    if (widget.type === "options") {
      const optionCount = (widget.config as OptionsWidgetConfig).options.length;
      height += STEP_NODE_ROW_HEIGHT * (1 + optionCount);
    } else {
      height += STEP_NODE_ROW_HEIGHT;
    }
  }

  height += 8;
  return height;
}

function getSortedSteps(steps: QuizStep[]): QuizStep[] {
  return [...steps].sort((a, b) => a.position - b.position);
}

function stepExists(steps: QuizStep[], stepId: string): boolean {
  return steps.some((s) => s.id === stepId);
}

function estimateConditionNodeHeight(branches: ConditionBranch[]): number {
  let height = CONDITION_NODE_HEADER_HEIGHT + CONDITION_NODE_PADDING;
  if (branches.length === 0) {
    height += CONDITION_NODE_EMPTY_HEIGHT;
  } else {
    height += branches.length * CONDITION_NODE_ROW_HEIGHT;
  }
  height += CONDITION_NODE_ROW_HEIGHT;
  return height + 8;
}

function getNodeDimensions(node: Node): { width: number; height: number } {
  if (node.type === "flowStart") {
    return { width: START_NODE_WIDTH, height: START_NODE_HEIGHT };
  }
  if (node.type === "flowCondition") {
    const data = node.data as FlowConditionNodeData;
    return {
      width: CONDITION_NODE_WIDTH,
      height: estimateConditionNodeHeight(data.branches),
    };
  }
  if (node.type === "flowFunction") {
    return { width: FUNCTION_NODE_WIDTH, height: FUNCTION_NODE_HEIGHT };
  }
  return {
    width: STEP_NODE_WIDTH,
    height: estimateStepNodeHeight(
      (node.data as FlowStepNodeData).step,
      (node.data as FlowStepNodeData).widgets ?? [],
    ),
  };
}

function getRedirectEdgeLabel(
  sourceHandle: string,
  widgets: QuizWidget[],
): string | null {
  const widgetId = parseRedirectHandle(sourceHandle);
  if (!widgetId) return null;
  const widget = widgets.find((item) => item.id === widgetId);
  if (widget?.type !== "redirect") return null;
  const config = widget.config as RedirectWidgetConfig;
  return `Redirecionar · ${config.delaySeconds}s`;
}

function getCountdownEdgeLabel(
  sourceHandle: string,
  widgets: QuizWidget[],
): string | null {
  const widgetId = parseCountdownHandle(sourceHandle);
  if (!widgetId) return null;
  const widget = widgets.find((item) => item.id === widgetId);
  if (widget?.type !== "countdown") return null;
  const config = widget.config as CountdownWidgetConfig;
  return config.labelAbove || "Contagem regressiva";
}

function getConditionEdgeLabel(
  sourceFn: FlowLayout["functionNodes"][number] | null | undefined,
  sourceHandle: string,
): string {
  if (!sourceFn || sourceFn.type !== "condition") return "Condições";
  const parsed = parseConditionHandle(sourceHandle);
  if (parsed === "else") return "Se não";
  if (!parsed || !sourceFn.config || !("branches" in sourceFn.config)) {
    return "Condições";
  }
  const branch = sourceFn.config.branches.find((b) => b.id === parsed.branchId);
  return branch ? formatConditionSummary(branch) : "Condições";
}

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 80, ranksep: 120 });

  for (const node of nodes) {
    const { width, height } = getNodeDimensions(node);
    g.setNode(node.id, { width, height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    const { width, height } = getNodeDimensions(node);
    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    };
  });
}

export function buildFlowGraph(params: {
  steps: QuizStep[];
  widgets: QuizWidget[];
  flowLayout: FlowLayout;
  design: QuizDesignSettings;
}): { nodes: Node[]; edges: Edge[] } {
  const { steps, widgets, flowLayout, design } = params;
  const sortedSteps = getSortedSteps(steps);
  const firstStep = sortedSteps[0];
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  nodes.push({
    id: FLOW_START_NODE_ID,
    type: "flowStart",
    position: flowLayout.nodePositions[FLOW_START_NODE_ID] ?? { x: 0, y: 0 },
    data: {},
    draggable: true,
  });

  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const stepWidgets = widgets
      .filter((w) => w.stepId === step.id)
      .sort((a, b) => a.position - b.position);
    const nodeId = flowStepNodeId(step.id);

    nodes.push({
      id: nodeId,
      type: "flowStep",
      position: flowLayout.nodePositions[nodeId] ?? { x: 0, y: 0 },
      data: {
        step,
        widgets: stepWidgets,
        design,
        stepIndex: i,
        totalSteps: sortedSteps.length,
      } satisfies FlowStepNodeData,
      draggable: true,
    });
  }

  for (const fn of flowLayout.functionNodes) {
    const nodeId = flowFunctionNodeId(fn.id);
    if (fn.type === "condition" && fn.config && "branches" in fn.config) {
      nodes.push({
        id: nodeId,
        type: "flowCondition",
        position: flowLayout.nodePositions[nodeId] ?? { x: 0, y: 0 },
        data: {
          functionId: fn.id,
          label: fn.label,
          branches: fn.config.branches,
        } satisfies FlowConditionNodeData,
        draggable: true,
      });
      continue;
    }

    nodes.push({
      id: nodeId,
      type: "flowFunction",
      position: flowLayout.nodePositions[nodeId] ?? { x: 0, y: 0 },
      data: {
        functionId: fn.id,
        type: fn.type,
        label: fn.label,
        ...(fn.type === "link"
          ? {
              linkUrl:
                fn.config && "url" in fn.config && fn.config.url
                  ? fn.config.url
                  : DEFAULT_LINK_URL,
              linkHasVariables: hasTemplateVariables(
                fn.config && "url" in fn.config && fn.config.url
                  ? fn.config.url
                  : "",
              ),
            }
          : {}),
      } satisfies FlowFunctionNodeData,
      draggable: true,
    });
  }

  if (firstStep) {
    edges.push({
      id: `edge-start-${firstStep.id}`,
      source: FLOW_START_NODE_ID,
      target: flowStepNodeId(firstStep.id),
      type: "flowLabeled",
      data: {
        label: "Início",
        edgeKind: "implicit",
        edgeId: `edge-start-${firstStep.id}`,
      } satisfies FlowEdgeData,
      animated: false,
      interactionWidth: FLOW_EDGE_INTERACTION_WIDTH,
    });
  }

  for (const step of sortedSteps) {
    const stepWidgets = widgets
      .filter((w) => w.stepId === step.id)
      .sort((a, b) => a.position - b.position);

    for (const widget of stepWidgets) {
      if (widget.type === "options") {
        const config = widget.config as OptionsWidgetConfig;
        for (const option of config.options) {
          if (!option.destinationStepId) continue;
          const targetId = flowStepNodeId(option.destinationStepId);
          const exists = stepExists(sortedSteps, option.destinationStepId);
          const edgeId = `edge-opt-${widget.id}::${option.id}`;
          edges.push({
            id: edgeId,
            source: flowStepNodeId(step.id),
            sourceHandle: optionHandleId(widget.id, option.id),
            target: targetId,
            type: "flowLabeled",
            data: {
              label: option.label,
              edgeKind: exists ? "navigation" : "orphan",
              edgeId,
            } satisfies FlowEdgeData,
            interactionWidth: FLOW_EDGE_INTERACTION_WIDTH,
          });
        }
      }

      if (widget.type === "button") {
        const config = widget.config as ButtonWidgetConfig;
        const edgeId = `edge-btn-${widget.id}`;
        if (config.destinationStepId) {
          const exists = stepExists(sortedSteps, config.destinationStepId);
          edges.push({
            id: edgeId,
            source: flowStepNodeId(step.id),
            sourceHandle: buttonHandleId(widget.id),
            target: flowStepNodeId(config.destinationStepId),
            type: "flowLabeled",
            data: {
              label: config.label,
              edgeKind: exists ? "navigation" : "orphan",
              edgeId,
            } satisfies FlowEdgeData,
            interactionWidth: FLOW_EDGE_INTERACTION_WIDTH,
          });
        }
      }
    }
  }

  for (const visualEdge of flowLayout.visualEdges) {
    const sourceFnId = parseFunctionIdFromFlowNode(visualEdge.source);
    const sourceFn = sourceFnId
      ? flowLayout.functionNodes.find((fn) => fn.id === sourceFnId)
      : null;
    const sourceHandle = normalizeFlowSourceHandle(
      visualEdge.sourceHandle,
      visualEdge.source,
    );
    const redirectLabel = getRedirectEdgeLabel(sourceHandle, widgets);
    const countdownLabel = getCountdownEdgeLabel(sourceHandle, widgets);
    const label =
      redirectLabel ??
      countdownLabel ??
      (sourceFn?.type === "set_variable" &&
      sourceFn.config &&
      "variableKey" in sourceFn.config &&
      sourceFn.config.variableKey
        ? sourceFn.config.variableKey
        : sourceFn?.type === "set_variable"
          ? "Variável"
          : sourceFn?.type === "link"
            ? "Link"
            : sourceFn?.type === "webhook"
              ? sourceFn.label || "Webhook"
              : sourceFn?.type === "condition"
                ? getConditionEdgeLabel(sourceFn, sourceHandle)
                : "Em breve");

    const targetHandle = normalizeFlowTargetHandle(
      visualEdge.targetHandle,
      visualEdge.target,
    );

    edges.push({
      id: visualEdge.id,
      source: visualEdge.source,
      sourceHandle,
      target: visualEdge.target,
      targetHandle,
      type: "flowLabeled",
      data: {
        label,
        edgeKind: "visual",
        edgeId: visualEdge.id,
      } satisfies FlowEdgeData,
      interactionWidth: FLOW_EDGE_INTERACTION_WIDTH,
    });
  }

  const layoutedNodes = applyDagreLayout(nodes, edges);

  const finalNodes = layoutedNodes.map((node) => {
    const stored = flowLayout.nodePositions[node.id];
    if (stored) {
      return { ...node, position: stored };
    }
    return node;
  });

  return { nodes: finalNodes, edges };
}

export function sanitizeFlowLayout(
  flowLayout: FlowLayout,
  deletedStepId: string,
  deletedWidgetIds: string[],
): FlowLayout {
  const deletedNodeId = flowStepNodeId(deletedStepId);
  const nodePositions = { ...flowLayout.nodePositions };
  delete nodePositions[deletedNodeId];

  const visualEdges = flowLayout.visualEdges.filter((edge) => {
    if (edge.source === deletedNodeId || edge.target === deletedNodeId) {
      return false;
    }
    for (const widgetId of deletedWidgetIds) {
      if (
        edge.sourceHandle.includes(widgetId) ||
        edge.source.includes(widgetId)
      ) {
        return false;
      }
    }
    return true;
  });

  return {
    ...flowLayout,
    nodePositions,
    visualEdges,
  };
}

export function sanitizeWidgetsDestinations(
  widgets: QuizWidget[],
  deletedStepId: string,
): QuizWidget[] {
  return widgets.map((widget) => {
    if (widget.type === "options") {
      const config = widget.config as OptionsWidgetConfig;
      const options = config.options.map((option) =>
        option.destinationStepId === deletedStepId
          ? { ...option, destinationStepId: null }
          : option,
      );
      return { ...widget, config: { ...config, options } };
    }
    if (widget.type === "button") {
      const config = widget.config as ButtonWidgetConfig;
      if (config.destinationStepId === deletedStepId) {
        return {
          ...widget,
          config: { ...config, destinationStepId: null },
        };
      }
    }
    return widget;
  });
}
