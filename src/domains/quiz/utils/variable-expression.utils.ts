import { extractVariableKeys } from "@/domains/quiz/utils/variable-template.utils";
import type { VariableMap } from "@/domains/quiz/utils/variable-template.utils";

const VARIABLE_PATTERN = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
const NUMERIC_OPERATOR_PATTERN = /[+\-*/()]/;

export type ExpressionEvaluationResult =
  | { ok: true; value: number | string | boolean }
  | { ok: false; error: string };

export function coerceVariableValue(value: unknown): number | string | boolean {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed !== "" && Number.isFinite(Number(trimmed))) {
      return Number(trimmed);
    }
    return value;
  }
  return String(value);
}

export function isNumericExpression(expression: string): boolean {
  const trimmed = expression.trim();
  if (!trimmed) return false;
  if (NUMERIC_OPERATOR_PATTERN.test(trimmed)) return true;
  return Number.isFinite(Number(trimmed));
}

function formatInterpolatedValue(value: unknown): string {
  const coerced = coerceVariableValue(value);
  if (typeof coerced === "number") return String(coerced);
  if (typeof coerced === "boolean") return coerced ? "true" : "false";
  return JSON.stringify(coerced);
}

export function interpolateExpression(
  expression: string,
  variables: VariableMap,
): string {
  return expression.replace(VARIABLE_PATTERN, (match, key: string) => {
    if (!(key in variables)) return match;
    return formatInterpolatedValue(variables[key]);
  });
}

type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if ("+-*/()".includes(char)) {
      if ("()".includes(char)) {
        tokens.push({ type: "paren", value: char as "(" | ")" });
      } else {
        tokens.push({ type: "op", value: char as "+" | "-" | "*" | "/" });
      }
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let raw = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        raw += input[i];
        i += 1;
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: "number", value });
      continue;
    }

    return null;
  }

  return tokens;
}

function parseExpression(tokens: Token[]): number | null {
  let index = 0;

  function parsePrimary(): number | null {
    const token = tokens[index];
    if (!token) return null;

    if (token.type === "paren" && token.value === "(") {
      index += 1;
      const value = parseAddSub();
      const closing = tokens[index];
      if (!closing || closing.type !== "paren" || closing.value !== ")") {
        return null;
      }
      index += 1;
      return value;
    }

    if (token.type === "number") {
      index += 1;
      return token.value;
    }

    if (token.type === "op" && token.value === "-") {
      index += 1;
      const value = parsePrimary();
      return value === null ? null : -value;
    }

    if (token.type === "op" && token.value === "+") {
      index += 1;
      return parsePrimary();
    }

    return null;
  }

  function parseMulDiv(): number | null {
    let left = parsePrimary();
    if (left === null) return null;

    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type !== "op" || (token.value !== "*" && token.value !== "/")) {
        break;
      }
      index += 1;
      const right = parsePrimary();
      if (right === null) return null;
      if (token.value === "/" && right === 0) return null;
      left = token.value === "*" ? left * right : left / right;
    }

    return left;
  }

  function parseAddSub(): number | null {
    let left = parseMulDiv();
    if (left === null) return null;

    while (index < tokens.length) {
      const token = tokens[index];
      if (token.type !== "op" || (token.value !== "+" && token.value !== "-")) {
        break;
      }
      index += 1;
      const right = parseMulDiv();
      if (right === null) return null;
      left = token.value === "+" ? left + right : left - right;
    }

    return left;
  }

  const result = parseAddSub();
  if (result === null || index !== tokens.length) return null;
  return result;
}

export function evaluateArithmetic(expression: string): number | null {
  const trimmed = expression.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (!tokens) return null;
  return parseExpression(tokens);
}

export function evaluateVariableExpression(
  expression: string,
  variables: VariableMap,
): number | string | boolean {
  const trimmed = expression.trim();
  if (!trimmed) return "";

  const interpolated = interpolateExpression(trimmed, variables);
  const hasUnresolved = extractVariableKeys(interpolated).length > 0;

  if (hasUnresolved) {
    return interpolated;
  }

  if (!isNumericExpression(interpolated)) {
    const unquoted = interpolated.replace(/^"(.*)"$/, "$1");
    if (unquoted === "true") return true;
    if (unquoted === "false") return false;
    return unquoted;
  }

  const numeric = evaluateArithmetic(interpolated);
  if (numeric !== null) return numeric;

  return interpolated;
}

export function evaluateVariableExpressionDetailed(
  expression: string,
  variables: VariableMap,
): ExpressionEvaluationResult {
  try {
    const value = evaluateVariableExpression(expression, variables);
    return { ok: true, value };
  } catch {
    return { ok: false, error: "Expressão inválida" };
  }
}
