const VARIABLE_REGEX_SOURCE = String.raw`\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}`;

function createVariablePattern() {
  return new RegExp(VARIABLE_REGEX_SOURCE, "g");
}

export type TemplatePart =
  | { type: "text"; value: string }
  | { type: "variable"; key: string; raw: string };

export function parseTemplateParts(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(createVariablePattern())) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: template.slice(lastIndex, index) });
    }

    parts.push({
      type: "variable",
      key: match[1],
      raw: match[0],
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push({ type: "text", value: template.slice(lastIndex) });
  }

  return parts;
}

export function hasTemplateVariables(template: string): boolean {
  return parseTemplateParts(template).some((part) => part.type === "variable");
}

export function extractVariableKeys(template: string): string[] {
  const keys = new Set<string>();
  for (const match of template.matchAll(createVariablePattern())) {
    keys.add(match[1]);
  }
  return [...keys];
}

function formatVariableValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value);
}

export function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(createVariablePattern(), (match, key: string) => {
    if (!(key in variables)) return match;
    return formatVariableValue(variables[key]);
  });
}

export function resolveLinkUrl(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(createVariablePattern(), (match, key: string) => {
    if (!(key in variables)) return match;
    return encodeURIComponent(formatVariableValue(variables[key]));
  });
}

export type VariableMap = Record<string, unknown>;
