import type { QuizVariable } from "@/domains/quiz/types/builder.types";
import type { WebhookMethod } from "@/domains/quiz/types/flow.types";

export type WebhookPayload = {
  event: string;
  quizId: string;
  functionId: string;
  variables: Record<string, unknown>;
};

export type WebhookDispatchResult = {
  ok: boolean;
  status: number | null;
  statusText?: string;
  bodyPreview?: string;
  error?: string;
};

const WEBHOOK_TIMEOUT_MS = 10_000;
const BODY_PREVIEW_MAX = 500;

export function buildWebhookPayload(params: {
  event: string;
  quizId: string;
  functionId: string;
  variableKeys: string[];
  variables: Record<string, unknown>;
}): WebhookPayload {
  const filtered: Record<string, unknown> = {};
  for (const key of params.variableKeys) {
    if (key in params.variables) {
      filtered[key] = params.variables[key];
    }
  }
  return {
    event: params.event,
    quizId: params.quizId,
    functionId: params.functionId,
    variables: filtered,
  };
}

export function buildSampleVariables(
  variableKeys: string[],
  registry: Pick<QuizVariable, "key" | "label" | "valueType">[],
): Record<string, unknown> {
  const byKey = new Map(registry.map((item) => [item.key, item]));
  const result: Record<string, unknown> = {};
  for (const key of variableKeys) {
    const item = byKey.get(key);
    const sampleValue = item?.label?.trim() || "valor_teste";
    result[key] =
      item?.valueType === "list" ? [sampleValue, "outro_valor"] : sampleValue;
  }
  return result;
}

/**
 * Bloqueia hosts internos/privados para mitigar SSRF.
 * Cobre loopback, link-local (incl. metadata 169.254.169.254), ranges
 * privados RFC1918, IPv6 ULA/loopback e sufixos internos comuns.
 */
export function isBlockedWebhookHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;

  const bracketless = host.replace(/^\[/, "").replace(/\]$/, "");

  if (
    bracketless === "localhost" ||
    bracketless.endsWith(".localhost") ||
    bracketless.endsWith(".internal") ||
    bracketless.endsWith(".local") ||
    bracketless === "metadata.google.internal"
  ) {
    return true;
  }

  // IPv6 loopback / ULA / link-local
  if (
    bracketless === "::1" ||
    bracketless === "::" ||
    bracketless.startsWith("fc") ||
    bracketless.startsWith("fd") ||
    bracketless.startsWith("fe80:")
  ) {
    return true;
  }

  // IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254)
  const mapped = bracketless.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(
    mapped ? mapped[1] : bracketless,
  );
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
  }

  return false;
}

export function validateWebhookUrl(
  url: string,
  options?: { allowLocalhost?: boolean },
): string | null {
  const trimmed = url.trim();
  if (!trimmed) return "URL do webhook é obrigatória";

  try {
    const parsed = new URL(trimmed);

    const isLocalhostDev =
      options?.allowLocalhost &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

    if (parsed.protocol !== "https:") {
      if (parsed.protocol === "http:" && isLocalhostDev) {
        return null;
      }
      if (parsed.protocol === "http:") {
        return "Use HTTPS na URL do webhook";
      }
      return "URL inválida";
    }

    if (!isLocalhostDev && isBlockedWebhookHost(parsed.hostname)) {
      return "URL do webhook aponta para um host interno não permitido";
    }

    return null;
  } catch {
    return "URL inválida";
  }
}

export async function dispatchWebhookRequest(params: {
  url: string;
  method: WebhookMethod;
  token?: string;
  payload?: WebhookPayload;
}): Promise<WebhookDispatchResult> {
  const urlError = validateWebhookUrl(params.url, {
    allowLocalhost: process.env.NODE_ENV === "development",
  });
  if (urlError) {
    return { ok: false, status: null, error: urlError };
  }

  const headers: Record<string, string> = {};
  if (params.token?.trim()) {
    headers["X-Webhook-Token"] = params.token.trim();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

  try {
    const init: RequestInit = {
      method: params.method,
      headers,
      signal: controller.signal,
    };

    if (params.method === "POST") {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(params.payload ?? {});
    }

    const response = await fetch(params.url.trim(), init);
    const bodyText = await response.text();
    const bodyPreview = bodyText.slice(0, BODY_PREVIEW_MAX);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      bodyPreview: bodyPreview || undefined,
      error: response.ok ? undefined : bodyPreview || response.statusText,
    };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Tempo esgotado ao chamar o webhook"
        : err instanceof Error
          ? err.message
          : "Erro ao chamar o webhook";
    return { ok: false, status: null, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
