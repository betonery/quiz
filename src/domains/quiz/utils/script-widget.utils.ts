export type ParsedScriptSnippet = {
  kind: "script";
  src?: string;
  inline?: string;
  async: boolean;
  defer: boolean;
  type?: string;
};

export type ParsedNoscriptSnippet = {
  kind: "noscript";
  html: string;
};

export type ParsedEmbedSnippet = ParsedScriptSnippet | ParsedNoscriptSnippet;

const SCRIPT_TAG_REGEX = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const NOSCRIPT_TAG_REGEX = /<noscript\b[^>]*>([\s\S]*?)<\/noscript>/gi;

function parseScriptAttributes(attrString: string): {
  src?: string;
  async: boolean;
  defer: boolean;
  type?: string;
} {
  const srcMatch = attrString.match(/\bsrc=["']([^"']+)["']/i);
  const typeMatch = attrString.match(/\btype=["']([^"']+)["']/i);
  const hasAsync = /\basync\b/i.test(attrString);
  const hasDefer = /\bdefer\b/i.test(attrString);

  return {
    src: srcMatch?.[1],
    async: hasAsync || (!hasDefer && Boolean(srcMatch)),
    defer: hasDefer,
    type: typeMatch?.[1],
  };
}

export function parseScriptEmbedCode(code: string): ParsedEmbedSnippet[] {
  const trimmed = code.trim();
  if (!trimmed) return [];

  const snippets: ParsedEmbedSnippet[] = [];

  for (const match of trimmed.matchAll(SCRIPT_TAG_REGEX)) {
    const attrs = parseScriptAttributes(match[1] ?? "");
    const inline = (match[2] ?? "").trim();

    if (attrs.src) {
      snippets.push({
        kind: "script",
        src: attrs.src,
        async: attrs.async,
        defer: attrs.defer,
        type: attrs.type,
      });
    } else if (inline) {
      snippets.push({
        kind: "script",
        inline,
        async: false,
        defer: false,
        type: attrs.type,
      });
    }
  }

  for (const match of trimmed.matchAll(NOSCRIPT_TAG_REGEX)) {
    const html = (match[1] ?? "").trim();
    if (html) {
      snippets.push({ kind: "noscript", html });
    }
  }

  return snippets;
}

export function hasScriptContent(code: string): boolean {
  return parseScriptEmbedCode(code).length > 0;
}

export function getScriptDedupeStorageKey(dedupeKey: string): string {
  return `adquiz:script:${dedupeKey}`;
}

export function wasScriptInjected(dedupeKey: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(getScriptDedupeStorageKey(dedupeKey)) === "1";
}

export function markScriptInjected(dedupeKey: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(getScriptDedupeStorageKey(dedupeKey), "1");
}

export type ScriptInjectionResult = {
  injectedNodes: Node[];
  skipped: boolean;
};

export function injectScriptSnippets(
  snippets: ParsedEmbedSnippet[],
  dedupeKey: string,
): ScriptInjectionResult {
  if (typeof document === "undefined" || snippets.length === 0) {
    return { injectedNodes: [], skipped: false };
  }

  if (wasScriptInjected(dedupeKey)) {
    return { injectedNodes: [], skipped: true };
  }

  const injectedNodes: Node[] = [];

  for (const snippet of snippets) {
    if (snippet.kind === "noscript") {
      const el = document.createElement("noscript");
      el.innerHTML = snippet.html;
      document.body.appendChild(el);
      injectedNodes.push(el);
      continue;
    }

    const scriptEl = document.createElement("script");

    if (snippet.type) {
      scriptEl.type = snippet.type;
    }

    if (snippet.src) {
      scriptEl.src = snippet.src;
      scriptEl.async = snippet.async;
      scriptEl.defer = snippet.defer;
    } else if (snippet.inline) {
      scriptEl.textContent = snippet.inline;
    } else {
      continue;
    }

    document.head.appendChild(scriptEl);
    injectedNodes.push(scriptEl);
  }

  if (injectedNodes.length > 0) {
    markScriptInjected(dedupeKey);
  }

  return { injectedNodes, skipped: false };
}

export function removeInjectedScriptNodes(nodes: Node[]): void {
  for (const node of nodes) {
    node.parentNode?.removeChild(node);
  }
}

export function getScriptPreviewLines(code: string, maxLines = 3): string {
  const trimmed = code.trim();
  if (!trimmed) {
    return "<script>// seu código aqui</script>";
  }

  const lines = trimmed.split("\n");
  if (lines.length <= maxLines) {
    return trimmed;
  }

  return `${lines.slice(0, maxLines).join("\n")}\n...`;
}

export function getScriptPreviewLabel(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "Script";

  const firstLine = trimmed.split("\n")[0]?.trim() ?? "";
  if (firstLine.length <= 40) return firstLine || "Script";
  return `${firstLine.slice(0, 37)}...`;
}
