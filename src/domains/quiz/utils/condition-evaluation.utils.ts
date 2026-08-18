import type {
  ConditionBranch,
  ConditionComparison,
  ConditionFunctionConfig,
  ConditionOperator,
} from "@/domains/quiz/types/flow.types";
import {
  FLOW_CONDITION_ELSE_HANDLE,
  conditionHandleId,
} from "@/domains/quiz/types/flow.types";

const OPERATOR_SYMBOLS: Record<ConditionOperator, string> = {
  eq: "=",
  neq: "≠",
  contains: "∋",
  not_contains: "∌",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  defined: "✓",
  empty: "∅",
  starts_with: "^",
  ends_with: "$",
  regex: ".*",
  not_regex: "!.*",
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: "Igual a",
  neq: "Diferente de",
  contains: "Contém",
  not_contains: "Não contém",
  gt: "Maior que",
  gte: "Maior ou igual a",
  lt: "Menor que",
  lte: "Menor ou igual a",
  defined: "Está definido",
  empty: "Está vazio",
  starts_with: "Começa com",
  ends_with: "Termina com",
  regex: "Corresponde ao regex",
  not_regex: "Não corresponde ao regex",
};

export const CONDITION_OPERATORS: ConditionOperator[] = [
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
];

export function formatOperatorSymbol(operator: ConditionOperator): string {
  return OPERATOR_SYMBOLS[operator];
}

export function formatOperatorLabel(operator: ConditionOperator): string {
  return OPERATOR_LABELS[operator];
}

export function operatorRequiresValue(operator: ConditionOperator): boolean {
  return operator !== "defined" && operator !== "empty";
}

function isDefined(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

function toComparableString(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function toComparableNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const str = toComparableString(value).trim();
  if (!str) return null;
  const num = Number(str);
  return Number.isNaN(num) ? null : num;
}

function compareNumeric(
  left: unknown,
  right: string,
  compare: (a: number, b: number) => boolean,
): boolean {
  const leftNum = toComparableNumber(left);
  const rightNum = toComparableNumber(right);
  if (leftNum === null || rightNum === null) return false;
  return compare(leftNum, rightNum);
}

export function evaluateComparison(
  comparison: ConditionComparison,
  variables: Record<string, unknown>,
): boolean {
  const raw = variables[comparison.variableKey];
  const value = comparison.value ?? "";

  switch (comparison.operator) {
    case "defined":
      return isDefined(raw);
    case "empty":
      return !isDefined(raw);
    case "eq":
      return toComparableString(raw) === value;
    case "neq":
      return toComparableString(raw) !== value;
    case "contains":
      return toComparableString(raw).includes(value);
    case "not_contains":
      return !toComparableString(raw).includes(value);
    case "gt":
      return compareNumeric(raw, value, (a, b) => a > b);
    case "gte":
      return compareNumeric(raw, value, (a, b) => a >= b);
    case "lt":
      return compareNumeric(raw, value, (a, b) => a < b);
    case "lte":
      return compareNumeric(raw, value, (a, b) => a <= b);
    case "starts_with":
      return toComparableString(raw).startsWith(value);
    case "ends_with":
      return toComparableString(raw).endsWith(value);
    case "regex": {
      try {
        return new RegExp(value).test(toComparableString(raw));
      } catch {
        return false;
      }
    }
    case "not_regex": {
      try {
        return !new RegExp(value).test(toComparableString(raw));
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

export function evaluateBranch(
  branch: ConditionBranch,
  variables: Record<string, unknown>,
): boolean {
  if (branch.comparisons.length === 0) return false;

  let result = evaluateComparison(branch.comparisons[0]!, variables);

  for (let i = 1; i < branch.comparisons.length; i++) {
    const comparison = branch.comparisons[i]!;
    const next = evaluateComparison(comparison, variables);
    if (comparison.joinWithPrevious === "or") {
      result = result || next;
    } else {
      result = result && next;
    }
  }

  return result;
}

export function resolveConditionHandle(
  config: ConditionFunctionConfig,
  variables: Record<string, unknown>,
): string {
  for (const branch of config.branches) {
    if (evaluateBranch(branch, variables)) {
      return conditionHandleId(branch.id);
    }
  }
  return FLOW_CONDITION_ELSE_HANDLE;
}

export function formatComparisonSummary(
  comparison: ConditionComparison,
): string {
  const symbol = formatOperatorSymbol(comparison.operator);
  const key = comparison.variableKey || "?";
  if (!operatorRequiresValue(comparison.operator)) {
    return `${symbol} ${key}`;
  }
  const val = comparison.value ?? "";
  return `${symbol} ${key} ${symbol} ${val}`;
}

export function formatConditionSummary(branch: ConditionBranch): string {
  if (branch.comparisons.length === 0) return "Condição vazia";
  const first = formatComparisonSummary(branch.comparisons[0]!);
  if (branch.comparisons.length === 1) return first;

  const parts = branch.comparisons.map((comparison, index) => {
    if (index === 0) return formatComparisonSummary(comparison);
    const join = comparison.joinWithPrevious === "or" ? "OU" : "E";
    return `${join} ${formatComparisonSummary(comparison)}`;
  });

  return parts.join(" ");
}
