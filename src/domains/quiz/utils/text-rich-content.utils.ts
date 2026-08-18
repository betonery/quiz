import type { JSONContent } from "@tiptap/react";
import DOMPurify from "isomorphic-dompurify";
import {
  extractVariableKeys,
  parseTemplateParts,
} from "@/domains/quiz/utils/variable-template.utils";
import { VARIABLE_CHIP_NODE } from "@/domains/quiz/widgets/text/tiptap-variable-extension";

const LEGACY_FONT_SIZE_MAP = {
  sm: 14,
  md: 16,
  lg: 20,
} as const;

export function migrateLegacyTextFontSize(
  fontSize: unknown,
  fontSizePx: unknown,
): number {
  if (typeof fontSizePx === "number" && Number.isFinite(fontSizePx)) {
    return Math.min(72, Math.max(12, fontSizePx));
  }
  if (fontSize === "sm" || fontSize === "md" || fontSize === "lg") {
    return LEGACY_FONT_SIZE_MAP[fontSize];
  }
  return 16;
}

export function migrateTextWidgetSource(
  merged: Record<string, unknown>,
  rawSource: Record<string, unknown> = {},
): Record<string, unknown> {
  const next = { ...merged };

  if (
    rawSource.fontSize === "sm" ||
    rawSource.fontSize === "md" ||
    rawSource.fontSize === "lg"
  ) {
    next.fontSizePx = LEGACY_FONT_SIZE_MAP[rawSource.fontSize];
  } else {
    next.fontSizePx = migrateLegacyTextFontSize(undefined, next.fontSizePx);
  }

  delete next.fontSize;

  if (next.contentMode !== "plain" && next.contentMode !== "rich") {
    next.contentMode = "plain";
  }
  if (next.richContent === undefined) {
    next.richContent = null;
  }
  if (typeof next.letterSpacingPx !== "number") {
    next.letterSpacingPx = 0;
  }

  return next;
}

function parseLineToRichNodes(line: string): JSONContent[] {
  const nodes: JSONContent[] = [];

  for (const part of parseTemplateParts(line)) {
    if (part.type === "text") {
      if (part.value) {
        nodes.push({ type: "text", text: part.value });
      }
      continue;
    }

    nodes.push({
      type: VARIABLE_CHIP_NODE,
      attrs: { key: part.key },
    });
  }

  return nodes;
}

export function plainContentToRichJson(content: string): string {
  const lines = content.split("\n");
  const paragraphs: JSONContent[] = lines.map((line) => {
    const inlineNodes = parseLineToRichNodes(line);
    return {
      type: "paragraph",
      content: inlineNodes.length > 0 ? inlineNodes : undefined,
    };
  });

  return JSON.stringify({
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph" }],
  } satisfies JSONContent);
}

export function parseRichContentDoc(richContent: string): JSONContent | null {
  try {
    const parsed = JSON.parse(richContent) as JSONContent;
    if (parsed?.type !== "doc") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function richContentToPlainText(richContent: string): string {
  const doc = parseRichContentDoc(richContent);
  if (!doc?.content) return "";

  const paragraphs: string[] = [];

  for (const block of doc.content) {
    if (block.type !== "paragraph") continue;
    const parts: string[] = [];

    for (const node of block.content ?? []) {
      if (node.type === "text" && node.text) {
        parts.push(node.text);
      }
      if (node.type === VARIABLE_CHIP_NODE && node.attrs?.key) {
        parts.push(`{{${String(node.attrs.key)}}}`);
      }
    }

    paragraphs.push(parts.join(""));
  }

  return paragraphs.join("\n");
}

export function extractVariableKeysFromRichContent(
  richContent: string,
): string[] {
  const doc = parseRichContentDoc(richContent);
  if (!doc) return [];

  const keys = new Set<string>();

  function walk(node: JSONContent) {
    if (node.type === VARIABLE_CHIP_NODE && node.attrs?.key) {
      keys.add(String(node.attrs.key));
    }
    for (const child of node.content ?? []) {
      walk(child);
    }
  }

  walk(doc);
  return [...keys];
}

export function extractTextWidgetVariableKeys(config: {
  content: string;
  contentMode?: string;
  richContent?: string | null;
}): string[] {
  const keys = new Set<string>();

  if (config.contentMode === "rich" && config.richContent) {
    for (const key of extractVariableKeysFromRichContent(config.richContent)) {
      keys.add(key);
    }
  } else {
    for (const key of extractVariableKeys(config.content)) {
      keys.add(key);
    }
  }

  return [...keys];
}

function formatVariableValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapTextNode(text: string, marks?: JSONContent["marks"]): string {
  let html = escapeHtml(text);

  for (const mark of marks ?? []) {
    if (mark.type === "bold") html = `<strong>${html}</strong>`;
    if (mark.type === "italic") html = `<em>${html}</em>`;
    if (mark.type === "underline") html = `<u>${html}</u>`;
    if (mark.type === "strike") html = `<s>${html}</s>`;
    if (mark.type === "textStyle" && mark.attrs?.color) {
      html = `<span style="color:${escapeHtml(String(mark.attrs.color))}">${html}</span>`;
    }
    if (mark.type === "highlight" && mark.attrs?.color) {
      html = `<span style="background-color:${escapeHtml(String(mark.attrs.color))}">${html}</span>`;
    }
  }

  return html;
}

function renderInlineNode(node: JSONContent): string {
  if (node.type === "text" && node.text) {
    return wrapTextNode(node.text, node.marks);
  }

  if (node.type === VARIABLE_CHIP_NODE && node.attrs?.key) {
    const key = escapeHtml(String(node.attrs.key));
    return `<span class="text-widget-variable-chip" data-variable="${key}">{{${key}}}</span>`;
  }

  if (node.type === "hardBreak") {
    return "<br />";
  }

  return "";
}

function renderBlockNode(node: JSONContent): string {
  if (node.type === "paragraph") {
    const inner = (node.content ?? []).map(renderInlineNode).join("");
    return `<p>${inner || "<br />"}</p>`;
  }

  return "";
}

function richDocToHtml(doc: JSONContent): string {
  return (doc.content ?? []).map(renderBlockNode).join("");
}

function resolveVariableNodes(
  doc: JSONContent,
  variables: Record<string, unknown>,
): JSONContent {
  if (doc.type === VARIABLE_CHIP_NODE) {
    const key = String(doc.attrs?.key ?? "");
    if (!key) return doc;
    if (!(key in variables)) return doc;
    return {
      type: "text",
      text: formatVariableValue(variables[key]),
    } satisfies JSONContent;
  }

  if (!doc.content) return doc;

  return {
    ...doc,
    content: doc.content.flatMap((child) => {
      const resolved = resolveVariableNodes(child, variables);
      return resolved ? [resolved] : [];
    }),
  };
}

export function resolveRichContentJson(
  richContent: string,
  variables: Record<string, unknown>,
): string {
  const doc = parseRichContentDoc(richContent);
  if (!doc) return richContent;
  return JSON.stringify(resolveVariableNodes(doc, variables));
}

export function richContentToHtml(richContent: string): string {
  const doc = parseRichContentDoc(richContent);
  if (!doc) return "";
  return richDocToHtml(doc);
}

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "span"],
    ALLOWED_ATTR: ["style", "data-variable", "class"],
  });
}

export function resolveRichHtmlVariables(
  html: string,
  variables: Record<string, unknown>,
): string {
  return html.replace(
    /<span[^>]*data-variable="([^"]+)"[^>]*>[\s\S]*?<\/span>/g,
    (match, key: string) => {
      if (!(key in variables)) return match;
      return escapeHtml(formatVariableValue(variables[key]));
    },
  );
}

export function renderRichTextHtml(
  richContent: string,
  variables?: Record<string, unknown>,
): string {
  const json =
    variables && Object.keys(variables).length > 0
      ? resolveRichContentJson(richContent, variables)
      : richContent;
  const html = richContentToHtml(json);
  return sanitizeRichHtml(html);
}

export function renameVariableKeyInRichContent(
  richContent: string,
  oldKey: string,
  newKey: string,
): string {
  const doc = parseRichContentDoc(richContent);
  if (!doc) return richContent;

  function walk(node: JSONContent): JSONContent {
    if (node.type === VARIABLE_CHIP_NODE && node.attrs?.key === oldKey) {
      return {
        ...node,
        attrs: { ...node.attrs, key: newKey },
      };
    }

    if (!node.content) return node;

    return {
      ...node,
      content: node.content.map(walk),
    };
  }

  return JSON.stringify(walk(doc));
}
