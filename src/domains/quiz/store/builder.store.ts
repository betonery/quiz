import { create } from "zustand";
import type {
  BuilderSnapshot,
  BuilderTab,
  ButtonWidgetConfig,
  CountdownWidgetConfig,
  CarouselWidgetConfig,
  TestimonialsWidgetConfig,
  ChartsWidgetConfig,
  FaqWidgetConfig,
  BenefitsWidgetConfig,
  ResultBlockWidgetConfig,
  ComparisonTableWidgetConfig,
  LogoBarWidgetConfig,
  InputWidgetConfig,
  OptionsWidgetConfig,
  QuizStep,
  QuizVariable,
  QuizWidget,
  WidgetConfig,
  WidgetType,
} from "@/domains/quiz/types/builder.types";
import {
  defaultQuizVariables,
  defaultStepSettings,
} from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import { defaultQuizDesignSettings } from "@/domains/quiz/types/design.types";
import type {
  QuizSettings,
  QuizCustomDomain,
} from "@/domains/quiz/types/quiz-settings.types";
import { defaultQuizSettings } from "@/domains/quiz/utils/quiz-settings.utils";
import {
  DEFAULT_LINK_URL,
  FLOW_FUNCTION_LABELS,
  conditionHandleId,
  defaultFlowLayout,
  flowFunctionNodeId,
  flowStepNodeId,
  normalizeFlowSourceHandle,
  normalizeFlowTargetHandle,
  parseButtonHandle,
  parseOptionHandle,
  parseRedirectHandle,
  parseCountdownHandle,
  countdownHandleId,
  parseStepIdFromFlowNode,
  type ConditionBranch,
  type ConditionComparison,
  type ConditionFunctionConfig,
  type FlowFunctionNode,
  type FlowFunctionType,
  type FlowLayout,
  type FlowVisualEdge,
  type LinkFunctionConfig,
  type WebhookFunctionConfig,
  type SetVariableFunctionConfig,
} from "@/domains/quiz/types/flow.types";
import {
  clearVariableFromFlowLayout,
  clearVariableKeyFromWidgets,
  ensureVariable,
  isVariableKeyTaken,
  renameVariableKeyInFlowLayout,
  renameVariableKeyInWidgets,
  validateVariableKey,
} from "@/domains/quiz/utils/variable-registry.utils";
import { getDefaultWidgetConfig } from "@/domains/quiz/registry/widget-registry";
import { generateId } from "@/domains/quiz/utils/generate-id";
import {
  sanitizeFlowLayout,
  sanitizeWidgetsDestinations,
} from "@/domains/quiz/utils/flow-graph.utils";
import { generateComponentId } from "@/domains/quiz/utils/widget-config.utils";

export type DesignSection = "header" | "colors" | "typography" | "animation";

export type SettingsSection = "slug" | "domain" | "integrations" | "share";

type FlowConnectionParams = {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type BuilderFeedbackVariant = "success" | "error" | "info";

type BuilderStore = {
  quizId: string;
  workspaceSlug: string;
  workspaceId: string;
  steps: QuizStep[];
  widgets: QuizWidget[];
  design: QuizDesignSettings;
  flowLayout: FlowLayout;
  variables: QuizVariable[];
  settings: QuizSettings;
  quizSlug: string;
  customDomain: QuizCustomDomain | null;
  flowEditorStepId: string | null;
  flowEditorFunctionId: string | null;
  pendingCenterFlowNodeId: string | null;
  activeTab: BuilderTab;
  activeDesignSection: DesignSection;
  activeSettingsSection: SettingsSection;
  activeStepId: string | null;
  selectedWidgetId: string | null;
  isDirty: boolean;
  feedback: string | null;
  feedbackVariant: BuilderFeedbackVariant;
  init: (params: {
    quizId: string;
    workspaceSlug: string;
    workspaceId: string;
    steps: QuizStep[];
    widgets: QuizWidget[];
    design: QuizDesignSettings;
    flowLayout: FlowLayout;
    variables?: QuizVariable[];
    settings?: QuizSettings;
    quizSlug?: string;
    customDomain?: QuizCustomDomain | null;
  }) => void;
  setFeedback: (
    message: string | null,
    variant?: BuilderFeedbackVariant,
  ) => void;
  setActiveTab: (tab: BuilderTab) => void;
  openFlowStepEditor: (stepId: string) => void;
  closeFlowStepEditor: () => void;
  openFlowFunctionEditor: (functionId: string) => void;
  closeFlowFunctionEditor: () => void;
  closeFlowEditor: () => void;
  clearPendingCenterFlowNode: () => void;
  setActiveDesignSection: (section: DesignSection) => void;
  setActiveSettingsSection: (section: SettingsSection) => void;
  setActiveStep: (stepId: string) => void;
  selectWidget: (widgetId: string | null) => void;
  updateStep: (
    stepId: string,
    patch: Partial<Pick<QuizStep, "title" | "settings">>,
  ) => void;
  updateDesign: (patch: Partial<QuizDesignSettings>) => void;
  updateSettings: (patch: Partial<QuizSettings>) => void;
  setQuizSlug: (slug: string) => void;
  setCustomDomain: (domain: QuizCustomDomain | null) => void;
  addStep: (options?: { centerInFlow?: boolean }) => void;
  duplicateStep: (stepId: string) => void;
  deleteStep: (stepId: string) => void;
  addWidget: (stepId: string, type: WidgetType, position: number) => void;
  updateWidget: (widgetId: string, config: WidgetConfig) => void;
  duplicateWidget: (widgetId: string) => void;
  deleteWidget: (widgetId: string) => void;
  reorderWidgets: (stepId: string, orderedIds: string[]) => void;
  setFlowNodePosition: (
    nodeId: string,
    position: { x: number; y: number },
  ) => void;
  addFlowFunctionNode: (type: FlowFunctionType) => void;
  updateFlowFunctionNode: (
    functionId: string,
    patch: {
      label?: string;
      config?:
        | SetVariableFunctionConfig
        | LinkFunctionConfig
        | ConditionFunctionConfig
        | WebhookFunctionConfig;
    },
  ) => void;
  addConditionBranch: (functionId: string) => void;
  removeConditionBranch: (functionId: string, branchId: string) => void;
  addConditionComparison: (
    functionId: string,
    branchId: string,
    joinWithPrevious: "and" | "or",
  ) => void;
  updateConditionComparison: (
    functionId: string,
    branchId: string,
    comparisonId: string,
    patch: Partial<
      Pick<
        ConditionComparison,
        "variableKey" | "operator" | "value" | "joinWithPrevious"
      >
    >,
  ) => void;
  removeConditionComparison: (
    functionId: string,
    branchId: string,
    comparisonId: string,
  ) => void;
  deleteFlowFunctionNode: (functionId: string) => void;
  duplicateFlowFunctionNode: (functionId: string) => void;
  connectFlowEdge: (params: FlowConnectionParams) => void;
  disconnectFlowEdge: (edgeId: string) => void;
  disconnectCountdownFlowEdges: (widgetId: string) => void;
  ensureQuizVariable: (
    key: string,
    label?: string,
    valueType?: QuizVariable["valueType"],
  ) => void;
  updateQuizVariableLabel: (key: string, label: string) => void;
  renameQuizVariable: (oldKey: string, newKey: string) => string | null;
  deleteQuizVariable: (key: string) => string | null;
  markClean: () => void;
  getSnapshot: () => BuilderSnapshot;
};

function reindexWidgets(widgets: QuizWidget[], stepId: string): QuizWidget[] {
  const stepWidgets = widgets
    .filter((w) => w.stepId === stepId)
    .sort((a, b) => a.position - b.position);

  const others = widgets.filter((w) => w.stepId !== stepId);
  const reindexed = stepWidgets.map((w, index) => ({ ...w, position: index }));

  return [...others, ...reindexed];
}

function isFunctionNode(nodeId: string): boolean {
  return nodeId.startsWith("fn-");
}

function getConditionConfig(
  fn: FlowFunctionNode,
): ConditionFunctionConfig | null {
  if (fn.type !== "condition" || !fn.config || !("branches" in fn.config)) {
    return null;
  }
  return fn.config;
}

function cloneConditionConfig(
  config: ConditionFunctionConfig,
): ConditionFunctionConfig {
  return {
    branches: config.branches.map((branch) => ({
      id: generateId(),
      comparisons: branch.comparisons.map((comparison) => ({
        ...comparison,
        id: generateId(),
      })),
    })),
  };
}

function updateConditionFunctionNode(
  functionNodes: FlowFunctionNode[],
  functionId: string,
  updater: (config: ConditionFunctionConfig) => ConditionFunctionConfig,
): FlowFunctionNode[] {
  return functionNodes.map((fn) => {
    if (fn.id !== functionId || fn.type !== "condition") return fn;
    const config = getConditionConfig(fn) ?? { branches: [] };
    return { ...fn, config: updater(config) };
  });
}

function updateOptionDestination(
  widgets: QuizWidget[],
  widgetId: string,
  optionId: string,
  destinationStepId: string | null,
): QuizWidget[] {
  return widgets.map((widget) => {
    if (widget.id !== widgetId || widget.type !== "options") return widget;
    const config = widget.config as OptionsWidgetConfig;
    return {
      ...widget,
      config: {
        ...config,
        options: config.options.map((option) =>
          option.id === optionId ? { ...option, destinationStepId } : option,
        ),
      },
    };
  });
}

function updateButtonDestination(
  widgets: QuizWidget[],
  widgetId: string,
  destinationStepId: string | null,
): QuizWidget[] {
  return widgets.map((widget) => {
    if (widget.id !== widgetId || widget.type !== "button") return widget;
    const config = widget.config as ButtonWidgetConfig;
    return {
      ...widget,
      config: { ...config, destinationStepId },
    };
  });
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  quizId: "",
  workspaceSlug: "",
  workspaceId: "",
  steps: [],
  widgets: [],
  design: defaultQuizDesignSettings,
  flowLayout: defaultFlowLayout,
  variables: defaultQuizVariables,
  settings: defaultQuizSettings,
  quizSlug: "",
  customDomain: null,
  flowEditorStepId: null,
  flowEditorFunctionId: null,
  pendingCenterFlowNodeId: null,
  activeTab: "flow",
  activeDesignSection: "header",
  activeSettingsSection: "slug",
  activeStepId: null,
  selectedWidgetId: null,
  isDirty: false,
  feedback: null,
  feedbackVariant: "info",

  init: ({
    quizId,
    workspaceSlug,
    workspaceId,
    steps,
    widgets,
    design,
    flowLayout,
    variables = defaultQuizVariables,
    settings = defaultQuizSettings,
    quizSlug = "",
    customDomain = null,
  }) => {
    const currentState = get();
    const activeStepId =
      currentState.quizId === quizId &&
      currentState.activeStepId &&
      steps.some((s) => s.id === currentState.activeStepId)
        ? currentState.activeStepId
        : (steps[0]?.id ?? null);

    set({
      quizId,
      workspaceSlug,
      workspaceId,
      steps,
      widgets,
      design,
      flowLayout,
      variables,
      settings,
      quizSlug,
      customDomain,
      activeStepId,
      selectedWidgetId: null,
      flowEditorStepId: null,
      flowEditorFunctionId: null,
      pendingCenterFlowNodeId: null,
      isDirty: false,
      feedback: null,
      feedbackVariant: "info",
    });
  },

  setFeedback: (feedback, variant = "info") =>
    set({
      feedback,
      feedbackVariant: feedback ? variant : "info",
    }),

  setActiveTab: (tab) => {
    if (tab !== "flow") {
      const state = get();
      const activeStepId =
        state.activeStepId &&
        state.steps.some((s) => s.id === state.activeStepId)
          ? state.activeStepId
          : (state.steps[0]?.id ?? null);

      set({
        activeTab: tab,
        flowEditorStepId: null,
        flowEditorFunctionId: null,
        selectedWidgetId: null,
        ...(tab === "design" ? { activeStepId } : {}),
      });
      return;
    }
    set({ activeTab: tab });
  },

  openFlowStepEditor: (stepId) =>
    set({
      flowEditorStepId: stepId,
      flowEditorFunctionId: null,
      activeStepId: stepId,
      selectedWidgetId: null,
    }),

  closeFlowStepEditor: () =>
    set({ flowEditorStepId: null, selectedWidgetId: null }),

  openFlowFunctionEditor: (functionId) =>
    set({
      flowEditorFunctionId: functionId,
      flowEditorStepId: null,
      selectedWidgetId: null,
    }),

  closeFlowFunctionEditor: () => set({ flowEditorFunctionId: null }),

  closeFlowEditor: () =>
    set({
      flowEditorStepId: null,
      flowEditorFunctionId: null,
      selectedWidgetId: null,
    }),

  clearPendingCenterFlowNode: () => set({ pendingCenterFlowNodeId: null }),

  setActiveDesignSection: (section) => set({ activeDesignSection: section }),

  setActiveSettingsSection: (section) =>
    set({ activeSettingsSection: section }),

  setActiveStep: (stepId) =>
    set({ activeStepId: stepId, selectedWidgetId: null }),

  selectWidget: (widgetId) => set({ selectedWidgetId: widgetId }),

  updateStep: (stepId, patch) =>
    set((state) => ({
      steps: state.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
      isDirty: true,
    })),

  updateDesign: (patch) =>
    set((state) => ({
      design: {
        ...state.design,
        ...patch,
        header: { ...state.design.header, ...(patch.header ?? {}) },
        colors: { ...state.design.colors, ...(patch.colors ?? {}) },
        typography: { ...state.design.typography, ...(patch.typography ?? {}) },
        animation: { ...state.design.animation, ...(patch.animation ?? {}) },
      },
      isDirty: true,
    })),

  updateSettings: (patch) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...patch,
        integrations: {
          ...state.settings.integrations,
          ...patch.integrations,
        },
      },
      isDirty: true,
    })),

  setQuizSlug: (slug) => set({ quizSlug: slug }),

  setCustomDomain: (domain) => set({ customDomain: domain }),

  addStep: (options) =>
    set((state) => {
      const position = state.steps.length;
      const newStep: QuizStep = {
        id: generateId(),
        quizId: state.quizId,
        workspaceId: state.workspaceId,
        title: `Etapa ${position + 1}`,
        position,
        settings: { ...defaultStepSettings },
      };
      return {
        steps: [...state.steps, newStep],
        activeStepId: newStep.id,
        selectedWidgetId: null,
        pendingCenterFlowNodeId: options?.centerInFlow
          ? flowStepNodeId(newStep.id)
          : null,
        isDirty: true,
      };
    }),

  duplicateStep: (stepId) =>
    set((state) => {
      const original = state.steps.find((s) => s.id === stepId);
      if (!original) return state;

      const newStepId = generateId();
      const insertAt = original.position + 1;
      const newStep: QuizStep = {
        ...original,
        id: newStepId,
        title: `${original.title} (cópia)`,
        position: insertAt,
      };

      const stepsWithCopy = [...state.steps];
      stepsWithCopy.splice(insertAt, 0, newStep);
      const steps = stepsWithCopy.map((step, index) => ({
        ...step,
        position: index,
      }));

      const stepWidgets = state.widgets
        .filter((w) => w.stepId === stepId)
        .sort((a, b) => a.position - b.position);

      const newWidgets = stepWidgets.map((widget) => {
        const copy: QuizWidget = {
          ...widget,
          id: generateId(),
          stepId: newStepId,
          config: {
            ...widget.config,
            componentId: generateComponentId(),
          },
        };

        if (copy.type === "input") {
          const config = copy.config as InputWidgetConfig;
          copy.config = { ...config };
        } else if (copy.type === "options") {
          const config = copy.config as OptionsWidgetConfig;
          copy.config = {
            ...config,
            options: config.options.map((option) => ({
              ...option,
              id: generateId(),
              destinationStepId: null,
            })),
          };
        } else if (copy.type === "button") {
          const config = copy.config as ButtonWidgetConfig;
          copy.config = { ...config, destinationStepId: null };
        } else if (copy.type === "carousel") {
          const config = copy.config as CarouselWidgetConfig;
          copy.config = {
            ...config,
            slides: config.slides.map((slide) => ({
              ...slide,
              id: generateId(),
            })),
          };
        } else if (copy.type === "testimonials") {
          const config = copy.config as TestimonialsWidgetConfig;
          copy.config = {
            ...config,
            items: config.items.map((item) => ({
              ...item,
              id: generateId(),
            })),
          };
        } else if (copy.type === "charts") {
          const config = copy.config as ChartsWidgetConfig;
          copy.config = {
            ...config,
            items: config.items.map((item) => ({
              ...item,
              id: generateId(),
            })),
          };
        } else if (copy.type === "faq") {
          const config = copy.config as FaqWidgetConfig;
          copy.config = {
            ...config,
            items: config.items.map((item) => ({
              ...item,
              id: generateId(),
            })),
          };
        } else if (copy.type === "benefits") {
          const config = copy.config as BenefitsWidgetConfig;
          copy.config = {
            ...config,
            items: config.items.map((item) => ({
              ...item,
              id: generateId(),
            })),
          };
        } else if (copy.type === "result-block") {
          const config = copy.config as ResultBlockWidgetConfig;
          const variants = config.variants.map((variant) => ({
            ...variant,
            id: generateId(),
          }));
          const defaultIndex = config.variants.findIndex(
            (variant) => variant.id === config.defaultVariantId,
          );
          copy.config = {
            ...config,
            variants,
            defaultVariantId:
              variants[defaultIndex >= 0 ? defaultIndex : 0]?.id ??
              config.defaultVariantId,
          };
        } else if (copy.type === "comparison-table") {
          const config = copy.config as ComparisonTableWidgetConfig;
          copy.config = {
            ...config,
            columns: config.columns.map((column) => ({
              ...column,
              id: generateId(),
            })),
            rows: config.rows.map((row) => ({
              ...row,
              id: generateId(),
            })),
          };
        } else if (copy.type === "logo-bar") {
          const config = copy.config as LogoBarWidgetConfig;
          copy.config = {
            ...config,
            items: config.items.map((item) => ({
              ...item,
              id: generateId(),
            })),
          };
        }

        return copy;
      });

      const originalNodeId = flowStepNodeId(stepId);
      const newNodeId = flowStepNodeId(newStepId);
      const originalPos = state.flowLayout.nodePositions[originalNodeId];
      const nodePositions = { ...state.flowLayout.nodePositions };
      if (originalPos) {
        nodePositions[newNodeId] = {
          x: originalPos.x + 40,
          y: originalPos.y + 40,
        };
      }

      return {
        steps,
        widgets: [...state.widgets, ...newWidgets],
        flowLayout: { ...state.flowLayout, nodePositions },
        activeStepId: newStepId,
        isDirty: true,
      };
    }),

  deleteStep: (stepId) =>
    set((state) => {
      if (state.steps.length <= 1) return state;
      const deletedWidgetIds = state.widgets
        .filter((w) => w.stepId === stepId)
        .map((w) => w.id);
      const steps = state.steps
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, position: i }));
      const widgets = sanitizeWidgetsDestinations(
        state.widgets.filter((w) => w.stepId !== stepId),
        stepId,
      );
      const flowLayout = sanitizeFlowLayout(
        state.flowLayout,
        stepId,
        deletedWidgetIds,
      );
      const activeStepId =
        state.activeStepId === stepId
          ? (steps[0]?.id ?? null)
          : state.activeStepId;
      const flowEditorStepId =
        state.flowEditorStepId === stepId ? null : state.flowEditorStepId;
      return {
        steps,
        widgets,
        flowLayout,
        activeStepId,
        flowEditorStepId,
        selectedWidgetId: null,
        isDirty: true,
      };
    }),

  addWidget: (stepId, type, position) =>
    set((state) => {
      const stepWidgets = state.widgets
        .filter((w) => w.stepId === stepId)
        .sort((a, b) => a.position - b.position);

      const newWidget: QuizWidget = {
        id: generateId(),
        stepId,
        workspaceId: state.workspaceId,
        type,
        position,
        config: getDefaultWidgetConfig(type),
      };

      stepWidgets.splice(position, 0, newWidget);
      const reindexed = stepWidgets.map((w, i) => ({ ...w, position: i }));
      const others = state.widgets.filter((w) => w.stepId !== stepId);

      return {
        widgets: [...others, ...reindexed],
        selectedWidgetId: newWidget.id,
        isDirty: true,
      };
    }),

  updateWidget: (widgetId, config) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.id === widgetId ? { ...w, config } : w,
      ),
      isDirty: true,
    })),

  duplicateWidget: (widgetId) =>
    set((state) => {
      const original = state.widgets.find((w) => w.id === widgetId);
      if (!original) return state;

      const stepWidgets = state.widgets
        .filter((w) => w.stepId === original.stepId)
        .sort((a, b) => a.position - b.position);

      const insertAt = original.position + 1;
      const copy: QuizWidget = {
        ...original,
        id: generateId(),
        position: insertAt,
        config: {
          ...original.config,
          componentId: generateComponentId(),
        },
      };

      if (copy.type === "carousel") {
        const config = copy.config as CarouselWidgetConfig;
        copy.config = {
          ...config,
          slides: config.slides.map((slide) => ({
            ...slide,
            id: generateId(),
          })),
        };
      }

      if (copy.type === "testimonials") {
        const config = copy.config as TestimonialsWidgetConfig;
        copy.config = {
          ...config,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        };
      }

      if (copy.type === "charts") {
        const config = copy.config as ChartsWidgetConfig;
        copy.config = {
          ...config,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        };
      }

      if (copy.type === "faq") {
        const config = copy.config as FaqWidgetConfig;
        copy.config = {
          ...config,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        };
      }

      if (copy.type === "benefits") {
        const config = copy.config as BenefitsWidgetConfig;
        copy.config = {
          ...config,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        };
      }

      if (copy.type === "result-block") {
        const config = copy.config as ResultBlockWidgetConfig;
        const variants = config.variants.map((variant) => ({
          ...variant,
          id: generateId(),
        }));
        const defaultIndex = config.variants.findIndex(
          (variant) => variant.id === config.defaultVariantId,
        );
        copy.config = {
          ...config,
          variants,
          defaultVariantId:
            variants[defaultIndex >= 0 ? defaultIndex : 0]?.id ??
            config.defaultVariantId,
        };
      }

      if (copy.type === "comparison-table") {
        const config = copy.config as ComparisonTableWidgetConfig;
        copy.config = {
          ...config,
          columns: config.columns.map((column) => ({
            ...column,
            id: generateId(),
          })),
          rows: config.rows.map((row) => ({
            ...row,
            id: generateId(),
          })),
        };
      }

      if (copy.type === "logo-bar") {
        const config = copy.config as LogoBarWidgetConfig;
        copy.config = {
          ...config,
          items: config.items.map((item) => ({
            ...item,
            id: generateId(),
          })),
        };
      }

      stepWidgets.splice(insertAt, 0, copy);
      const reindexed = stepWidgets.map((w, i) => ({ ...w, position: i }));
      const others = state.widgets.filter((w) => w.stepId !== original.stepId);

      return {
        widgets: [...others, ...reindexed],
        selectedWidgetId: copy.id,
        isDirty: true,
      };
    }),

  deleteWidget: (widgetId) =>
    set((state) => {
      const target = state.widgets.find((w) => w.id === widgetId);
      if (!target) return state;
      const widgets = reindexWidgets(
        state.widgets.filter((w) => w.id !== widgetId),
        target.stepId,
      );
      return {
        widgets,
        selectedWidgetId:
          state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
        isDirty: true,
      };
    }),

  reorderWidgets: (stepId, orderedIds) =>
    set((state) => {
      const stepWidgets = orderedIds
        .map((id, position) => {
          const widget = state.widgets.find((w) => w.id === id);
          return widget ? { ...widget, position } : null;
        })
        .filter((w): w is QuizWidget => w !== null);

      const others = state.widgets.filter((w) => w.stepId !== stepId);
      return { widgets: [...others, ...stepWidgets], isDirty: true };
    }),

  setFlowNodePosition: (nodeId, position) =>
    set((state) => ({
      flowLayout: {
        ...state.flowLayout,
        nodePositions: {
          ...state.flowLayout.nodePositions,
          [nodeId]: position,
        },
      },
      isDirty: true,
    })),

  addFlowFunctionNode: (type) =>
    set((state) => {
      const id = generateId();
      const fn = {
        id,
        type,
        label: FLOW_FUNCTION_LABELS[type],
        ...(type === "link"
          ? { config: { url: DEFAULT_LINK_URL, openInNewWindow: false } }
          : type === "set_variable"
            ? { config: { variableKey: "", expression: "" } }
            : type === "condition"
              ? { config: { branches: [] } }
              : type === "webhook"
                ? {
                    config: {
                      url: "",
                      method: "POST",
                      token: "",
                      variableKeys: [],
                    },
                  }
                : {}),
      };
      return {
        flowLayout: {
          ...state.flowLayout,
          functionNodes: [...state.flowLayout.functionNodes, fn],
        },
        flowEditorFunctionId:
          type === "set_variable" ||
          type === "link" ||
          type === "condition" ||
          type === "webhook"
            ? id
            : null,
        pendingCenterFlowNodeId: flowFunctionNodeId(id),
        flowEditorStepId: null,
        isDirty: true,
      };
    }),

  updateFlowFunctionNode: (functionId, patch) =>
    set((state) => {
      let variables = state.variables;
      const functionNodes = state.flowLayout.functionNodes.map((fn) => {
        if (fn.id !== functionId) return fn;
        const next = {
          ...fn,
          ...(patch.label !== undefined ? { label: patch.label } : {}),
          ...(patch.config !== undefined ? { config: patch.config } : {}),
        };
        if (
          next.type === "set_variable" &&
          patch.config &&
          "variableKey" in patch.config &&
          patch.config.variableKey &&
          (!fn.config ||
            !("variableKey" in fn.config) ||
            patch.config.variableKey !== fn.config.variableKey)
        ) {
          variables = ensureVariable(
            variables,
            patch.config.variableKey,
            next.label,
          );
        }
        return next;
      });
      return {
        variables,
        flowLayout: { ...state.flowLayout, functionNodes },
        isDirty: true,
      };
    }),

  deleteFlowFunctionNode: (functionId) =>
    set((state) => {
      const nodeId = flowFunctionNodeId(functionId);
      const nodePositions = { ...state.flowLayout.nodePositions };
      delete nodePositions[nodeId];
      return {
        flowLayout: {
          ...state.flowLayout,
          functionNodes: state.flowLayout.functionNodes.filter(
            (fn) => fn.id !== functionId,
          ),
          visualEdges: state.flowLayout.visualEdges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId,
          ),
          nodePositions,
        },
        flowEditorFunctionId:
          state.flowEditorFunctionId === functionId
            ? null
            : state.flowEditorFunctionId,
        isDirty: true,
      };
    }),

  duplicateFlowFunctionNode: (functionId) =>
    set((state) => {
      const original = state.flowLayout.functionNodes.find(
        (fn) => fn.id === functionId,
      );
      if (!original) return state;
      const id = generateId();
      let copyConfig = original.config;
      if (
        original.type === "condition" &&
        original.config &&
        "branches" in original.config
      ) {
        copyConfig = cloneConditionConfig(original.config);
      } else if (
        original.type === "webhook" &&
        original.config &&
        "variableKeys" in original.config
      ) {
        copyConfig = {
          ...original.config,
          variableKeys: [...original.config.variableKeys],
        };
      }
      const copy = { ...original, id, config: copyConfig };
      const originalPos =
        state.flowLayout.nodePositions[flowFunctionNodeId(functionId)];
      const newNodeId = flowFunctionNodeId(id);
      const nodePositions = { ...state.flowLayout.nodePositions };
      if (originalPos) {
        nodePositions[newNodeId] = {
          x: originalPos.x + 40,
          y: originalPos.y + 40,
        };
      }
      return {
        flowLayout: {
          ...state.flowLayout,
          functionNodes: [...state.flowLayout.functionNodes, copy],
          nodePositions,
        },
        pendingCenterFlowNodeId: originalPos ? null : newNodeId,
        isDirty: true,
      };
    }),

  addConditionBranch: (functionId) =>
    set((state) => {
      const comparison: ConditionComparison = {
        id: generateId(),
        variableKey: "",
        operator: "eq",
        value: "",
      };
      const branch: ConditionBranch = {
        id: generateId(),
        comparisons: [comparison],
      };
      return {
        flowLayout: {
          ...state.flowLayout,
          functionNodes: updateConditionFunctionNode(
            state.flowLayout.functionNodes,
            functionId,
            (config) => ({
              branches: [...config.branches, branch],
            }),
          ),
        },
        isDirty: true,
      };
    }),

  removeConditionBranch: (functionId, branchId) =>
    set((state) => {
      const nodeId = flowFunctionNodeId(functionId);
      const handle = conditionHandleId(branchId);
      return {
        flowLayout: {
          ...state.flowLayout,
          functionNodes: updateConditionFunctionNode(
            state.flowLayout.functionNodes,
            functionId,
            (config) => ({
              branches: config.branches.filter((b) => b.id !== branchId),
            }),
          ),
          visualEdges: state.flowLayout.visualEdges.filter(
            (edge) => !(edge.source === nodeId && edge.sourceHandle === handle),
          ),
        },
        isDirty: true,
      };
    }),

  addConditionComparison: (functionId, branchId, joinWithPrevious) =>
    set((state) => ({
      flowLayout: {
        ...state.flowLayout,
        functionNodes: updateConditionFunctionNode(
          state.flowLayout.functionNodes,
          functionId,
          (config) => ({
            branches: config.branches.map((branch) => {
              if (branch.id !== branchId) return branch;
              return {
                ...branch,
                comparisons: [
                  ...branch.comparisons,
                  {
                    id: generateId(),
                    variableKey: "",
                    operator: "eq",
                    value: "",
                    joinWithPrevious,
                  },
                ],
              };
            }),
          }),
        ),
      },
      isDirty: true,
    })),

  updateConditionComparison: (functionId, branchId, comparisonId, patch) =>
    set((state) => {
      let variables = state.variables;
      const functionNodes = updateConditionFunctionNode(
        state.flowLayout.functionNodes,
        functionId,
        (config) => ({
          branches: config.branches.map((branch) => {
            if (branch.id !== branchId) return branch;
            return {
              ...branch,
              comparisons: branch.comparisons.map((comparison) => {
                if (comparison.id !== comparisonId) return comparison;
                return { ...comparison, ...patch };
              }),
            };
          }),
        }),
      );

      if (patch.variableKey) {
        const fn = functionNodes.find((item) => item.id === functionId);
        if (fn) {
          variables = ensureVariable(variables, patch.variableKey, fn.label);
        }
      }

      return {
        variables,
        flowLayout: { ...state.flowLayout, functionNodes },
        isDirty: true,
      };
    }),

  removeConditionComparison: (functionId, branchId, comparisonId) =>
    set((state) => ({
      flowLayout: {
        ...state.flowLayout,
        functionNodes: updateConditionFunctionNode(
          state.flowLayout.functionNodes,
          functionId,
          (config) => ({
            branches: config.branches.map((branch) => {
              if (branch.id !== branchId) return branch;
              const comparisons = branch.comparisons.filter(
                (c) => c.id !== comparisonId,
              );
              return { ...branch, comparisons };
            }),
          }),
        ),
      },
      isDirty: true,
    })),

  connectFlowEdge: ({ source, target, sourceHandle, targetHandle }) =>
    set((state) => {
      const normalizedSourceHandle = normalizeFlowSourceHandle(
        sourceHandle,
        source,
      );
      const normalizedTargetHandle = normalizeFlowTargetHandle(
        targetHandle,
        target,
      );
      const involvesFunction = isFunctionNode(source) || isFunctionNode(target);

      if (involvesFunction) {
        let widgets = state.widgets;
        if (sourceHandle?.startsWith("opt-")) {
          const parsed = parseOptionHandle(sourceHandle);
          if (parsed) {
            widgets = updateOptionDestination(
              widgets,
              parsed.widgetId,
              parsed.optionId,
              null,
            );
          }
        } else if (sourceHandle?.startsWith("btn-")) {
          const widgetId = parseButtonHandle(sourceHandle);
          if (widgetId) {
            widgets = updateButtonDestination(widgets, widgetId, null);
          }
        } else if (sourceHandle?.startsWith("cnt-")) {
          const widgetId = parseCountdownHandle(sourceHandle);
          if (!widgetId) return state;
          const widget = widgets.find((item) => item.id === widgetId);
          if (
            !widget ||
            widget.type !== "countdown" ||
            !(widget.config as CountdownWidgetConfig).flowOutputEnabled
          ) {
            return state;
          }
        }

        const visualEdge: FlowVisualEdge = {
          id: generateId(),
          source,
          sourceHandle: normalizedSourceHandle,
          target,
          targetHandle: normalizedTargetHandle,
        };
        const filtered = state.flowLayout.visualEdges.filter(
          (edge) =>
            !(
              edge.source === source &&
              normalizeFlowSourceHandle(edge.sourceHandle, edge.source) ===
                normalizedSourceHandle
            ),
        );
        return {
          widgets,
          flowLayout: {
            ...state.flowLayout,
            visualEdges: [...filtered, visualEdge],
          },
          isDirty: true,
        };
      }

      const targetStepId = parseStepIdFromFlowNode(target);
      if (!targetStepId || !sourceHandle) return state;

      if (sourceHandle.startsWith("opt-")) {
        const parsed = parseOptionHandle(sourceHandle);
        if (!parsed) return state;
        return {
          widgets: updateOptionDestination(
            state.widgets,
            parsed.widgetId,
            parsed.optionId,
            targetStepId,
          ),
          isDirty: true,
        };
      }

      if (sourceHandle.startsWith("btn-")) {
        const widgetId = parseButtonHandle(sourceHandle);
        if (!widgetId) return state;
        return {
          widgets: updateButtonDestination(
            state.widgets,
            widgetId,
            targetStepId,
          ),
          isDirty: true,
        };
      }

      if (sourceHandle.startsWith("rdt-")) {
        const widgetId = parseRedirectHandle(sourceHandle);
        if (!widgetId) return state;

        const visualEdge: FlowVisualEdge = {
          id: generateId(),
          source,
          sourceHandle: normalizedSourceHandle,
          target,
          targetHandle: normalizedTargetHandle,
        };
        const filtered = state.flowLayout.visualEdges.filter(
          (edge) =>
            !(
              edge.source === source &&
              normalizeFlowSourceHandle(edge.sourceHandle, edge.source) ===
                normalizedSourceHandle
            ),
        );
        return {
          flowLayout: {
            ...state.flowLayout,
            visualEdges: [...filtered, visualEdge],
          },
          isDirty: true,
        };
      }

      if (sourceHandle.startsWith("cnt-")) {
        const widgetId = parseCountdownHandle(sourceHandle);
        if (!widgetId) return state;

        const widget = state.widgets.find((item) => item.id === widgetId);
        if (
          !widget ||
          widget.type !== "countdown" ||
          !(widget.config as CountdownWidgetConfig).flowOutputEnabled
        ) {
          return state;
        }

        const visualEdge: FlowVisualEdge = {
          id: generateId(),
          source,
          sourceHandle: normalizedSourceHandle,
          target,
          targetHandle: normalizedTargetHandle,
        };
        const filtered = state.flowLayout.visualEdges.filter(
          (edge) =>
            !(
              edge.source === source &&
              normalizeFlowSourceHandle(edge.sourceHandle, edge.source) ===
                normalizedSourceHandle
            ),
        );
        return {
          flowLayout: {
            ...state.flowLayout,
            visualEdges: [...filtered, visualEdge],
          },
          isDirty: true,
        };
      }

      return state;
    }),

  disconnectFlowEdge: (edgeId) =>
    set((state) => {
      if (edgeId.startsWith("edge-start-")) return state;

      if (edgeId.startsWith("edge-opt-")) {
        const rest = edgeId.slice("edge-opt-".length);
        const sep = rest.indexOf("::");
        if (sep === -1) return state;
        const widgetId = rest.slice(0, sep);
        const optionId = rest.slice(sep + 2);
        return {
          widgets: updateOptionDestination(
            state.widgets,
            widgetId,
            optionId,
            null,
          ),
          isDirty: true,
        };
      }

      if (edgeId.startsWith("edge-btn-")) {
        const widgetId = edgeId.slice("edge-btn-".length);
        return {
          widgets: updateButtonDestination(state.widgets, widgetId, null),
          isDirty: true,
        };
      }

      return {
        flowLayout: {
          ...state.flowLayout,
          visualEdges: state.flowLayout.visualEdges.filter(
            (edge) => edge.id !== edgeId,
          ),
        },
        isDirty: true,
      };
    }),

  disconnectCountdownFlowEdges: (widgetId) =>
    set((state) => {
      const handleId = countdownHandleId(widgetId);
      const nextEdges = state.flowLayout.visualEdges.filter(
        (edge) =>
          normalizeFlowSourceHandle(edge.sourceHandle, edge.source) !==
          handleId,
      );

      if (nextEdges.length === state.flowLayout.visualEdges.length) {
        return state;
      }

      return {
        flowLayout: {
          ...state.flowLayout,
          visualEdges: nextEdges,
        },
        isDirty: true,
      };
    }),

  ensureQuizVariable: (key, label, valueType) =>
    set((state) => {
      const next = ensureVariable(state.variables, key, label, valueType);
      if (next === state.variables) return state;
      return { variables: next, isDirty: true };
    }),

  updateQuizVariableLabel: (key, label) =>
    set((state) => ({
      variables: state.variables.map((item) =>
        item.key === key ? { ...item, label: label.trim() || undefined } : item,
      ),
      isDirty: true,
    })),

  renameQuizVariable: (oldKey, newKey) => {
    const validationError = validateVariableKey(newKey);
    if (validationError) return validationError;

    const state = get();
    if (!state.variables.some((item) => item.key === oldKey)) {
      return "Variável não encontrada";
    }
    if (
      isVariableKeyTaken(state.variables, newKey, [oldKey]) ||
      oldKey === newKey
    ) {
      return "Esta chave de variável já está em uso";
    }

    set({
      variables: state.variables.map((item) =>
        item.key === oldKey ? { ...item, key: newKey } : item,
      ),
      widgets: renameVariableKeyInWidgets(state.widgets, oldKey, newKey),
      flowLayout: renameVariableKeyInFlowLayout(
        state.flowLayout,
        oldKey,
        newKey,
      ),
      isDirty: true,
    });
    return null;
  },

  deleteQuizVariable: (key) => {
    const state = get();
    if (!state.variables.some((item) => item.key === key)) {
      return "Variável não encontrada";
    }

    set({
      variables: state.variables.filter((item) => item.key !== key),
      widgets: clearVariableKeyFromWidgets(state.widgets, key),
      flowLayout: clearVariableFromFlowLayout(state.flowLayout, key),
      isDirty: true,
    });
    return null;
  },

  markClean: () => set({ isDirty: false }),

  getSnapshot: () => {
    const { steps, widgets, design, flowLayout, variables, settings } = get();
    return { steps, widgets, design, flowLayout, variables, settings };
  },
}));
