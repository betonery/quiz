import type { QuizVariable } from "@/domains/quiz/types/builder.types";
import type {
  ButtonWidgetConfig,
  InputWidgetConfig,
  OptionsWidgetConfig,
  QuizWidget,
  TextWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import type {
  FlowFunctionNode,
  FlowLayout,
} from "@/domains/quiz/types/flow.types";
import type { SetVariableFunctionConfig } from "@/domains/quiz/types/flow.types";
import { extractVariableKeys } from "@/domains/quiz/utils/variable-template.utils";
import {
  extractTextWidgetVariableKeys,
  renameVariableKeyInRichContent,
  richContentToPlainText,
} from "@/domains/quiz/utils/text-rich-content.utils";

const VARIABLE_KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function getSetVariableConfig(
  fn: FlowFunctionNode,
): SetVariableFunctionConfig | null {
  if (
    fn.type !== "set_variable" ||
    !fn.config ||
    !("variableKey" in fn.config)
  ) {
    return null;
  }
  return fn.config;
}

export function slugifyVariableKey(source: string): string {
  const slug = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!slug) return "variavel";
  if (/^[0-9]/.test(slug)) return `var_${slug}`;
  return slug;
}

export function validateVariableKey(key: string): string | null {
  if (!key.trim()) return "Informe o nome da variável";
  if (!VARIABLE_KEY_REGEX.test(key)) {
    return "Use apenas letras, números e _ (não pode começar com número)";
  }
  return null;
}

export function ensureVariable(
  registry: QuizVariable[],
  key: string,
  label?: string,
  valueType?: QuizVariable["valueType"],
): QuizVariable[] {
  if (!key) return registry;

  const existing = registry.find((item) => item.key === key);
  if (existing) {
    const nextValueType = valueType ?? existing.valueType ?? "string";
    const nextLabel = label?.trim() || existing.label;
    if (
      nextValueType === (existing.valueType ?? "string") &&
      nextLabel === existing.label
    ) {
      return registry;
    }
    return registry.map((item) =>
      item.key === key
        ? {
            ...item,
            label: nextLabel,
            valueType: nextValueType,
          }
        : item,
    );
  }

  return [
    ...registry,
    {
      key,
      label,
      valueType: valueType ?? "string",
    },
  ];
}

export function isVariableKeyTaken(
  registry: QuizVariable[],
  key: string,
  excludeKeys: string[] = [],
): boolean {
  if (!key || excludeKeys.includes(key)) return false;
  return registry.some((item) => item.key === key);
}

export function suggestUniqueVariableKey(
  registry: QuizVariable[],
  baseLabel: string,
): string {
  const base = slugifyVariableKey(baseLabel);
  if (!registry.some((item) => item.key === base)) return base;

  let index = 2;
  while (registry.some((item) => item.key === `${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}

export function collectVariableKeysFromWidgets(
  widgets: QuizWidget[],
): string[] {
  const keys = new Set<string>();

  for (const widget of widgets) {
    if (widget.type === "input") {
      const key = (widget.config as InputWidgetConfig).variableKey;
      if (key) keys.add(key);
    }
    if (widget.type === "options") {
      const key = (widget.config as OptionsWidgetConfig).variableKey;
      if (key) keys.add(key);
    }
    if (widget.type === "text") {
      for (const key of extractTextWidgetVariableKeys(
        widget.config as TextWidgetConfig,
      )) {
        keys.add(key);
      }
    }
    if (widget.type === "button") {
      const label = (widget.config as ButtonWidgetConfig).label;
      if (label) keys.add(slugifyVariableKey(label));
    }
  }

  return [...keys];
}

export function collectVariableKeysFromFlowLayout(
  flowLayout: FlowLayout,
): string[] {
  const keys = new Set<string>();
  for (const fn of flowLayout.functionNodes) {
    const config = getSetVariableConfig(fn);
    if (config?.variableKey) {
      keys.add(config.variableKey);
    }
    if (config?.expression) {
      for (const key of extractVariableKeys(config.expression)) {
        keys.add(key);
      }
    }
    if (fn.type === "condition" && fn.config && "branches" in fn.config) {
      for (const branch of fn.config.branches) {
        for (const comparison of branch.comparisons) {
          if (comparison.variableKey) keys.add(comparison.variableKey);
        }
      }
    }
  }
  return [...keys];
}

export function collectFlowVariableTargetKeys(
  flowLayout: FlowLayout,
): string[] {
  const keys = new Set<string>();
  for (const fn of flowLayout.functionNodes) {
    const config = getSetVariableConfig(fn);
    if (config?.variableKey) {
      keys.add(config.variableKey);
    }
  }
  return [...keys];
}

export function parseQuizVariables(raw: unknown): QuizVariable[] {
  if (!Array.isArray(raw)) return [];
  const variables: QuizVariable[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const key = String((item as { key?: unknown }).key ?? "");
    if (!VARIABLE_KEY_REGEX.test(key)) continue;
    const label = (item as { label?: unknown }).label;
    const rawValueType = (item as { valueType?: unknown }).valueType;
    const valueType =
      rawValueType === "list" || rawValueType === "string"
        ? rawValueType
        : "string";
    variables.push({
      key,
      label: typeof label === "string" && label.trim() ? label : undefined,
      valueType,
    });
  }
  return variables;
}

export type VariableUsage = {
  type: "input" | "options" | "text" | "flow_target" | "flow_expression";
  description: string;
};

export function getVariableUsages(
  key: string,
  widgets: QuizWidget[],
  flowLayout: FlowLayout,
): VariableUsage[] {
  const usages: VariableUsage[] = [];

  for (const widget of widgets) {
    if (widget.type === "input") {
      const config = widget.config as InputWidgetConfig;
      if (config.variableKey === key) {
        usages.push({
          type: "input",
          description: `Entrada: ${config.label || "sem label"}`,
        });
      }
    }
    if (widget.type === "options") {
      const config = widget.config as OptionsWidgetConfig;
      if (config.variableKey === key) {
        usages.push({
          type: "options",
          description: config.multipleChoice
            ? "Widget de opções (lista)"
            : "Widget de opções",
        });
      }
    }
    if (widget.type === "text") {
      const config = widget.config as TextWidgetConfig;
      if (extractTextWidgetVariableKeys(config).includes(key)) {
        usages.push({
          type: "text",
          description: "Texto com interpolação",
        });
      }
    }
  }

  for (const fn of flowLayout.functionNodes) {
    const config = getSetVariableConfig(fn);
    if (config?.variableKey === key) {
      usages.push({
        type: "flow_target",
        description: `Nó Variável: ${fn.label}`,
      });
    }
    if (config?.expression) {
      if (extractVariableKeys(config.expression).includes(key)) {
        usages.push({
          type: "flow_expression",
          description: `Expressão em: ${fn.label}`,
        });
      }
    }
    if (fn.type === "condition" && fn.config && "branches" in fn.config) {
      for (const branch of fn.config.branches) {
        for (const comparison of branch.comparisons) {
          if (comparison.variableKey === key) {
            usages.push({
              type: "flow_expression",
              description: `Condição em: ${fn.label}`,
            });
            break;
          }
        }
      }
    }
  }

  return usages;
}

export function renameVariableKeyInTemplate(
  template: string,
  oldKey: string,
  newKey: string,
): string {
  return template.replace(
    new RegExp(`\\{\\{\\s*${escapeRegExp(oldKey)}\\s*\\}\\}`, "g"),
    `{{${newKey}}}`,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renameVariableKeyInWidgets(
  widgets: QuizWidget[],
  oldKey: string,
  newKey: string,
): QuizWidget[] {
  return widgets.map((widget) => {
    if (widget.type === "input") {
      const config = widget.config as InputWidgetConfig;
      if (config.variableKey !== oldKey) return widget;
      return {
        ...widget,
        config: { ...config, variableKey: newKey },
      };
    }
    if (widget.type === "options") {
      const config = widget.config as OptionsWidgetConfig;
      if (config.variableKey !== oldKey) return widget;
      return {
        ...widget,
        config: { ...config, variableKey: newKey },
      };
    }
    if (widget.type === "text") {
      const config = widget.config as TextWidgetConfig;
      if (!extractTextWidgetVariableKeys(config).includes(oldKey))
        return widget;

      if (config.contentMode === "rich" && config.richContent) {
        const richContent = renameVariableKeyInRichContent(
          config.richContent,
          oldKey,
          newKey,
        );
        return {
          ...widget,
          config: {
            ...config,
            richContent,
            content: richContentToPlainText(richContent),
          },
        };
      }

      return {
        ...widget,
        config: {
          ...config,
          content: renameVariableKeyInTemplate(config.content, oldKey, newKey),
        },
      };
    }
    return widget;
  });
}

export function renameVariableKeyInFlowLayout(
  flowLayout: FlowLayout,
  oldKey: string,
  newKey: string,
): FlowLayout {
  return {
    ...flowLayout,
    functionNodes: flowLayout.functionNodes.map((fn) => {
      const config = getSetVariableConfig(fn);
      if (!config) return fn;
      const nextConfig = { ...config };
      if (nextConfig.variableKey === oldKey) {
        nextConfig.variableKey = newKey;
      }
      if (nextConfig.expression) {
        nextConfig.expression = renameVariableKeyInTemplate(
          nextConfig.expression,
          oldKey,
          newKey,
        );
      }
      return { ...fn, config: nextConfig };
    }),
  };
}

export function clearVariableKeyFromWidgets(
  widgets: QuizWidget[],
  key: string,
): QuizWidget[] {
  return widgets.map((widget) => {
    if (widget.type === "input") {
      const config = widget.config as InputWidgetConfig;
      if (config.variableKey !== key) return widget;
      return { ...widget, config: { ...config, variableKey: "" } };
    }
    if (widget.type === "options") {
      const config = widget.config as OptionsWidgetConfig;
      if (config.variableKey !== key) return widget;
      return { ...widget, config: { ...config, variableKey: "" } };
    }
    return widget;
  });
}

export function clearVariableFromFlowLayout(
  flowLayout: FlowLayout,
  key: string,
): FlowLayout {
  return {
    ...flowLayout,
    functionNodes: flowLayout.functionNodes.map((fn) => {
      const config = getSetVariableConfig(fn);
      if (!config || config.variableKey !== key) return fn;
      return {
        ...fn,
        config: { ...config, variableKey: "" },
      };
    }),
  };
}
