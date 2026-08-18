import type {
  BuilderSnapshot,
  ButtonWidgetConfig,
  CarouselWidgetConfig,
  TestimonialsWidgetConfig,
  ChartsWidgetConfig,
  FaqWidgetConfig,
  BenefitsWidgetConfig,
  ComparisonTableWidgetConfig,
  LogoBarWidgetConfig,
  OptionsWidgetConfig,
  QuizStep,
  QuizWidget,
  ResultBlockWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type {
  ConditionBranch,
  ConditionComparison,
  ConditionFunctionConfig,
  FlowFunctionNode,
  FlowLayout,
  FlowVisualEdge,
} from "@/domains/quiz/types/flow.types";
import {
  buttonHandleId,
  conditionHandleId,
  flowFunctionNodeId,
  flowStepNodeId,
  optionHandleId,
  parseButtonHandle,
  parseConditionHandle,
  parseFunctionIdFromFlowNode,
  parseOptionHandle,
  parseRedirectHandle,
  parseCountdownHandle,
  parseStepIdFromFlowNode,
  redirectHandleId,
  countdownHandleId,
} from "@/domains/quiz/types/flow.types";
import type { ShareableQuizSnapshot } from "@/domains/quiz/types/quiz-share.types";
import { generateId } from "@/domains/quiz/utils/generate-id";
import { generateComponentId } from "@/domains/quiz/utils/widget-config.utils";

function remapStepDestination(
  stepId: string | null | undefined,
  stepIdMap: Map<string, string>,
): string | null {
  if (!stepId) return null;
  return stepIdMap.get(stepId) ?? null;
}

function remapFlowNodeId(
  nodeId: string,
  stepIdMap: Map<string, string>,
  functionIdMap: Map<string, string>,
): string {
  const stepId = parseStepIdFromFlowNode(nodeId);
  if (stepId) {
    const mapped = stepIdMap.get(stepId);
    return mapped ? flowStepNodeId(mapped) : nodeId;
  }

  const functionId = parseFunctionIdFromFlowNode(nodeId);
  if (functionId) {
    const mapped = functionIdMap.get(functionId);
    return mapped ? flowFunctionNodeId(mapped) : nodeId;
  }

  return nodeId;
}

function remapSourceHandle(
  handle: string,
  widgetIdMap: Map<string, string>,
  optionIdMap: Map<string, string>,
  branchIdMap: Map<string, string>,
): string {
  const optionParsed = parseOptionHandle(handle);
  if (optionParsed) {
    const newWidgetId =
      widgetIdMap.get(optionParsed.widgetId) ?? optionParsed.widgetId;
    const optionKey = `${optionParsed.widgetId}::${optionParsed.optionId}`;
    const newOptionId = optionIdMap.get(optionKey) ?? optionParsed.optionId;
    return optionHandleId(newWidgetId, newOptionId);
  }

  const buttonWidgetId = parseButtonHandle(handle);
  if (buttonWidgetId) {
    const newWidgetId = widgetIdMap.get(buttonWidgetId) ?? buttonWidgetId;
    return buttonHandleId(newWidgetId);
  }

  const redirectWidgetId = parseRedirectHandle(handle);
  if (redirectWidgetId) {
    const newWidgetId = widgetIdMap.get(redirectWidgetId) ?? redirectWidgetId;
    return redirectHandleId(newWidgetId);
  }

  const countdownWidgetId = parseCountdownHandle(handle);
  if (countdownWidgetId) {
    const newWidgetId = widgetIdMap.get(countdownWidgetId) ?? countdownWidgetId;
    return countdownHandleId(newWidgetId);
  }

  const conditionParsed = parseConditionHandle(handle);
  if (conditionParsed && conditionParsed !== "else") {
    const newBranchId =
      branchIdMap.get(conditionParsed.branchId) ?? conditionParsed.branchId;
    return conditionHandleId(newBranchId);
  }

  return handle;
}

export function cloneShareSnapshotForImport(
  snapshot: ShareableQuizSnapshot,
  quizId: string,
  workspaceId: string,
): BuilderSnapshot {
  const stepIdMap = new Map<string, string>();
  const widgetIdMap = new Map<string, string>();
  const optionIdMap = new Map<string, string>();
  const functionIdMap = new Map<string, string>();
  const branchIdMap = new Map<string, string>();

  const steps: QuizStep[] = snapshot.steps.map((step) => {
    const newId = generateId();
    stepIdMap.set(step.id, newId);
    return {
      ...step,
      id: newId,
      quizId,
      workspaceId,
    };
  });

  const widgets: QuizWidget[] = snapshot.widgets.map((widget) => {
    const newWidgetId = generateId();
    widgetIdMap.set(widget.id, newWidgetId);
    const componentId = generateComponentId();
    const stepId = stepIdMap.get(widget.stepId) ?? widget.stepId;

    if (widget.type === "options") {
      const config = widget.config as OptionsWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          options: config.options.map((option) => {
            const newOptionId = generateId();
            optionIdMap.set(`${widget.id}::${option.id}`, newOptionId);
            return {
              ...option,
              id: newOptionId,
              destinationStepId: remapStepDestination(
                option.destinationStepId,
                stepIdMap,
              ),
            };
          }),
        },
      };
    }

    if (widget.type === "button") {
      const config = widget.config as ButtonWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          destinationStepId: remapStepDestination(
            config.destinationStepId,
            stepIdMap,
          ),
        },
      };
    }

    if (widget.type === "carousel") {
      const config = widget.config as CarouselWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          slides: config.slides.map((slide) => ({
            ...slide,
            id: generateId(),
          })),
        },
      };
    }

    if (widget.type === "testimonials") {
      const config = widget.config as TestimonialsWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        },
      };
    }

    if (widget.type === "charts") {
      const config = widget.config as ChartsWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        },
      };
    }

    if (widget.type === "faq") {
      const config = widget.config as FaqWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        },
      };
    }

    if (widget.type === "benefits") {
      const config = widget.config as BenefitsWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        },
      };
    }

    if (widget.type === "result-block") {
      const config = widget.config as ResultBlockWidgetConfig;
      const variants = config.variants.map((variant) => ({
        ...variant,
        id: generateId(),
      }));
      const defaultIndex = config.variants.findIndex(
        (variant) => variant.id === config.defaultVariantId,
      );
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          variants,
          defaultVariantId:
            variants[defaultIndex >= 0 ? defaultIndex : 0]?.id ??
            config.defaultVariantId,
        },
      };
    }

    if (widget.type === "comparison-table") {
      const config = widget.config as ComparisonTableWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          columns: config.columns.map((column) => ({
            ...column,
            id: generateId(),
          })),
          rows: config.rows.map((row) => ({
            ...row,
            id: generateId(),
          })),
        },
      };
    }

    if (widget.type === "logo-bar") {
      const config = widget.config as LogoBarWidgetConfig;
      return {
        ...widget,
        id: newWidgetId,
        stepId,
        workspaceId,
        config: {
          ...config,
          componentId,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        },
      };
    }

    return {
      ...widget,
      id: newWidgetId,
      stepId,
      workspaceId,
      config: {
        ...widget.config,
        componentId,
      },
    };
  });

  const functionNodes: FlowFunctionNode[] =
    snapshot.flowLayout.functionNodes.map((node) => {
      const newFunctionId = generateId();
      functionIdMap.set(node.id, newFunctionId);

      if (
        node.type === "condition" &&
        node.config &&
        "branches" in node.config
      ) {
        const originalBranches = (node.config as ConditionFunctionConfig)
          .branches;
        const branches: ConditionBranch[] = originalBranches.map((branch) => {
          const newBranchId = generateId();
          branchIdMap.set(branch.id, newBranchId);
          const comparisons: ConditionComparison[] = branch.comparisons.map(
            (comparison) => ({
              ...comparison,
              id: generateId(),
            }),
          );
          return { id: newBranchId, comparisons };
        });

        return {
          ...node,
          id: newFunctionId,
          config: { branches },
        };
      }

      if (
        node.type === "webhook" &&
        node.config &&
        "variableKeys" in node.config
      ) {
        return {
          ...node,
          id: newFunctionId,
          config: {
            ...node.config,
            token: "",
            variableKeys: [...node.config.variableKeys],
          },
        };
      }

      return { ...node, id: newFunctionId, config: node.config };
    });

  const nodePositions: FlowLayout["nodePositions"] = {};
  for (const [nodeId, position] of Object.entries(
    snapshot.flowLayout.nodePositions,
  )) {
    const remappedId = remapFlowNodeId(nodeId, stepIdMap, functionIdMap);
    nodePositions[remappedId] = position;
  }

  const visualEdges: FlowVisualEdge[] = snapshot.flowLayout.visualEdges.map(
    (edge) => ({
      ...edge,
      id: generateId(),
      source: remapFlowNodeId(edge.source, stepIdMap, functionIdMap),
      target: remapFlowNodeId(edge.target, stepIdMap, functionIdMap),
      sourceHandle: remapSourceHandle(
        edge.sourceHandle,
        widgetIdMap,
        optionIdMap,
        branchIdMap,
      ),
      targetHandle: edge.targetHandle,
    }),
  );

  return {
    steps,
    widgets,
    design: snapshot.design,
    flowLayout: {
      nodePositions,
      functionNodes,
      visualEdges,
    },
    variables: snapshot.variables.map((variable) => ({ ...variable })),
    settings: snapshot.settings,
  };
}
