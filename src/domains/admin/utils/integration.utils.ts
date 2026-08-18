import type {
  AdminIntegrationRow,
  DetectedPath,
  IntegrationKind,
  IntegrationStatus,
  PayloadPath,
} from "@/domains/admin/types/integration.types";

/** Nome da Edge Function que recebe os webhooks. */
export const WEBHOOK_FUNCTION_NAME = "webhook-in";

/** A base precisa ser absoluta: a plataforma externa chama de fora. */
export function isValidWebhookBase(supabaseUrl: string): boolean {
  if (!supabaseUrl) return false;
  try {
    const { protocol } = new URL(supabaseUrl);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * `null` quando a base é inválida. Antes isto devolvia um caminho relativo
 * ("/functions/v1/..."), que a UI exibia como se fosse uma URL boa — a
 * plataforma de vendas recusava o envio e não havia log nenhum para investigar,
 * porque a requisição nunca saía.
 */
export function buildWebhookUrl(
  supabaseUrl: string,
  token: string,
): string | null {
  if (!isValidWebhookBase(supabaseUrl)) return null;
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/functions/v1/${WEBHOOK_FUNCTION_NAME}/${token}`;
}

/** `["data","customer","email"]` → `"data.customer.email"`. */
export function pathToLabel(path: PayloadPath): string {
  return path.join(".");
}

export function labelToPath(label: string): PayloadPath {
  return label
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function getValueAtPath(payload: unknown, path: PayloadPath): unknown {
  let current: unknown = payload;

  for (const segment of path) {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function previewOf(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "—";
  if (typeof value === "string") {
    return value.length > 60 ? `${value.slice(0, 59)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.length} item(s)]`;
  return "{…}";
}

const MAX_DEPTH = 6;
const MAX_PATHS = 400;

/**
 * Percorre o payload de exemplo e devolve os caminhos disponíveis para o
 * admin escolher nos selects do mapeamento.
 *
 * Arrays entram duas vezes: o caminho do próprio array (para `reference_any`)
 * e os caminhos dentro do primeiro elemento (para um caminho fixo).
 */
export function extractPayloadPaths(payload: unknown): DetectedPath[] {
  const result: DetectedPath[] = [];

  function walk(value: unknown, path: PayloadPath, depth: number) {
    if (result.length >= MAX_PATHS || depth > MAX_DEPTH) return;

    if (Array.isArray(value)) {
      if (path.length > 0) {
        result.push({
          path,
          label: pathToLabel(path),
          preview: previewOf(value),
          isArray: true,
        });
      }
      if (value.length > 0) {
        walk(value[0], [...path, "0"], depth + 1);
      }
      return;
    }

    if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(
        value as Record<string, unknown>,
      )) {
        walk(child, [...path, key], depth + 1);
      }
      return;
    }

    if (path.length === 0) return;

    result.push({
      path,
      label: pathToLabel(path),
      preview: previewOf(value),
      isArray: false,
    });
  }

  walk(payload, [], 0);
  return result;
}

/** Só os caminhos que apontam para arrays — usados no modo `reference_any`. */
export function extractArrayPaths(payload: unknown): DetectedPath[] {
  return extractPayloadPaths(payload).filter((entry) => entry.isArray);
}

/** Chaves disponíveis dentro do primeiro elemento de um array. */
export function extractArrayItemKeys(
  payload: unknown,
  arrayPath: PayloadPath,
): string[] {
  const target = getValueAtPath(payload, arrayPath);
  if (!Array.isArray(target) || target.length === 0) return [];

  const first = target[0];
  if (first === null || typeof first !== "object" || Array.isArray(first)) {
    return [];
  }

  return Object.keys(first as Record<string, unknown>);
}

function hasPath(mapping: Record<string, unknown>, key: string): boolean {
  const value = mapping[key];
  return Array.isArray(value) && value.length > 0;
}

export function isMappingComplete(
  kind: IntegrationKind,
  mapping: Record<string, unknown>,
): boolean {
  if (!mapping || Object.keys(mapping).length === 0) return false;

  if (kind === "refund") {
    // Precisa de ao menos uma forma de encontrar a compra original.
    return hasPath(mapping, "email") || hasPath(mapping, "externalPaymentId");
  }

  if (!hasPath(mapping, "email") || !hasPath(mapping, "externalPaymentId")) {
    return false;
  }

  const plan = mapping.plan as Record<string, unknown> | undefined;
  const planOk =
    plan?.mode === "fixed"
      ? typeof plan.planId === "string" && plan.planId.length > 0
      : plan?.mode === "reference"
        ? Array.isArray(plan.path) && plan.path.length > 0
        : plan?.mode === "reference_any"
          ? Array.isArray(plan.arrayPath) &&
            plan.arrayPath.length > 0 &&
            typeof plan.key === "string" &&
            plan.key.length > 0
          : false;

  if (!planOk) return false;

  const access = mapping.access as Record<string, unknown> | undefined;
  const accessOk =
    access?.mode === "fixed"
      ? typeof access.days === "number" && access.days > 0
      : access?.mode === "path"
        ? Array.isArray(access.path) && access.path.length > 0
        : false;

  return accessOk;
}

/**
 * Estado derivado — não é coluna, para não sair de sincronia com os dados.
 */
export function describeIntegrationStatus(
  integration: Pick<AdminIntegrationRow, "kind" | "enabled" | "fieldMapping">,
  eventCount: number,
): IntegrationStatus {
  const complete = isMappingComplete(
    integration.kind,
    integration.fieldMapping,
  );

  if (!complete) {
    return eventCount === 0 ? "awaiting_sample" : "needs_mapping";
  }

  return integration.enabled ? "active" : "ready";
}

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  awaiting_sample: "Aguardando evento de teste",
  needs_mapping: "Mapear campos",
  ready: "Pronta, desativada",
  active: "Ativa",
};

/**
 * Gera o identificador da plataforma a partir do nome, respeitando o formato
 * aceito pelo banco (`^[a-z][a-z0-9_-]*$`, até 40 chars).
 */
export function slugifyProvider(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");

  if (base.length === 0) return "plataforma";
  if (!/^[a-z]/.test(base)) return `p-${base}`.slice(0, 40);
  return base;
}
