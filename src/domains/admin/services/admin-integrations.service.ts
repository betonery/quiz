import "server-only";

import type {
  AdminIntegrationDetail,
  AdminIntegrationEventRow,
  AdminIntegrationRow,
  IntegrationEventStatus,
  IntegrationKind,
  MappingPreview,
} from "@/domains/admin/types/integration.types";
import { buildWebhookUrl } from "@/domains/admin/utils/integration.utils";
import { countBy } from "@/domains/admin/utils/admin-query.utils";
import { createAdminClient } from "@/services/supabase/admin";
import type { Json } from "@/types/database.types";

/**
 * Colunas seguras para sair do servidor. `default_password`, `token` e
 * `signature_secret` só saem por funções específicas — a senha nunca chega ao
 * client, e a URL completa (que contém o token) é montada só na página de
 * detalhe.
 */
const SAFE_COLUMNS =
  "id, name, kind, provider_slug, enabled, field_mapping, created_at, updated_at";

type IntegrationDbRow = {
  id: string;
  name: string;
  kind: string;
  provider_slug: string;
  enabled: boolean;
  field_mapping: Json;
  created_at: string;
  updated_at: string;
};

function asRecord(value: Json | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapIntegration(
  row: IntegrationDbRow,
  stats: {
    eventCount: number;
    failedCount: number;
    lastEventAt: string | null;
    hasDefaultPassword: boolean;
  },
): AdminIntegrationRow {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as IntegrationKind,
    providerSlug: row.provider_slug,
    enabled: row.enabled,
    fieldMapping: asRecord(row.field_mapping),
    hasDefaultPassword: stats.hasDefaultPassword,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventCount: stats.eventCount,
    failedCount: stats.failedCount,
    lastEventAt: stats.lastEventAt,
  };
}

/**
 * Estatísticas derivadas dos eventos. Ficam fora da tabela de integrações de
 * propósito: um UPDATE de contador a cada webhook geraria lock de linha numa
 * integração de volume.
 */
async function loadEventStats(integrationIds: string[]) {
  const empty = {
    counts: new Map<string, number>(),
    failed: new Map<string, number>(),
    last: new Map<string, string>(),
  };

  if (integrationIds.length === 0) return empty;

  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_integration_events")
    .select("integration_id, status, created_at")
    .in("integration_id", integrationIds)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = data ?? [];
  const last = new Map<string, string>();
  for (const row of rows) {
    if (!last.has(row.integration_id)) {
      last.set(row.integration_id, row.created_at);
    }
  }

  return {
    counts: countBy(rows, (row) => row.integration_id),
    failed: countBy(
      rows.filter((row) => row.status === "failed"),
      (row) => row.integration_id,
    ),
    last,
  };
}

export async function listIntegrations(): Promise<AdminIntegrationRow[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("platform_integrations")
    .select(`${SAFE_COLUMNS}, default_password`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const stats = await loadEventStats(data.map((row) => row.id));

  return data.map((row) =>
    mapIntegration(row, {
      eventCount: stats.counts.get(row.id) ?? 0,
      failedCount: stats.failed.get(row.id) ?? 0,
      lastEventAt: stats.last.get(row.id) ?? null,
      hasDefaultPassword: Boolean(row.default_password),
    }),
  );
}

/** Total de eventos com falha, para o badge do painel. */
export async function countFailedIntegrationEvents(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("platform_integration_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed");

  return count ?? 0;
}

function mapEvent(row: {
  id: string;
  integration_id: string;
  event_key: string | null;
  payload: Json;
  status: string;
  outcome: string | null;
  error_message: string | null;
  resolved: Json | null;
  workspace_id: string | null;
  created_at: string;
  processed_at: string | null;
}): AdminIntegrationEventRow {
  return {
    id: row.id,
    integrationId: row.integration_id,
    eventKey: row.event_key,
    payload: asRecord(row.payload),
    status: row.status as IntegrationEventStatus,
    outcome: row.outcome,
    errorMessage: row.error_message,
    resolved: row.resolved ? asRecord(row.resolved) : null,
    workspaceId: row.workspace_id,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  };
}

export async function getIntegrationDetail(
  integrationId: string,
  appSupabaseUrl: string,
): Promise<AdminIntegrationDetail | null> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("platform_integrations")
    .select(`${SAFE_COLUMNS}, token, default_password`)
    .eq("id", integrationId)
    .maybeSingle();

  if (!row) return null;

  const { data: eventRows } = await admin
    .from("platform_integration_events")
    .select("*")
    .eq("integration_id", integrationId)
    .order("created_at", { ascending: false })
    .limit(30);

  const events = (eventRows ?? []).map(mapEvent);
  const failedCount = events.filter((e) => e.status === "failed").length;

  return {
    integration: mapIntegration(row, {
      eventCount: events.length,
      failedCount,
      lastEventAt: events[0]?.createdAt ?? null,
      hasDefaultPassword: Boolean(row.default_password),
    }),
    webhookUrl: buildWebhookUrl(appSupabaseUrl, row.token),
    events,
  };
}

/** Leitura pontual da senha padrão. Nunca deve ser exposta a um client. */
export async function getIntegrationDefaultPassword(
  integrationId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_integrations")
    .select("default_password")
    .eq("id", integrationId)
    .maybeSingle();

  return data?.default_password ?? null;
}

export async function getIntegrationRow(integrationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_integrations")
    .select("id, name, kind, provider_slug, enabled")
    .eq("id", integrationId)
    .maybeSingle();

  return data;
}

// --- Escritas --------------------------------------------------------------

export async function createIntegration(input: {
  name: string;
  kind: IntegrationKind;
  providerSlug: string;
  createdBy: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("platform_integrations")
    .insert({
      name: input.name,
      kind: input.kind,
      provider_slug: input.providerSlug,
      created_by: input.createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: "Não foi possível criar a integração." };
  }

  return { success: true, id: data.id };
}

export async function updateIntegration(
  integrationId: string,
  input: {
    name: string;
    providerSlug: string;
    enabled: boolean;
    fieldMapping: unknown;
    /** `null` preserva a senha atual; `""` limpa. */
    defaultPassword: string | null;
  },
): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("platform_integrations")
    .update({
      name: input.name,
      provider_slug: input.providerSlug,
      enabled: input.enabled,
      field_mapping: input.fieldMapping as Json,
      // Omitir a chave preserva a senha atual; string vazia limpa.
      ...(input.defaultPassword !== null
        ? {
            default_password:
              input.defaultPassword.length > 0 ? input.defaultPassword : null,
          }
        : {}),
    })
    .eq("id", integrationId);

  return !error;
}

export async function setIntegrationEnabled(
  integrationId: string,
  enabled: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_integrations")
    .update({ enabled })
    .eq("id", integrationId);

  return !error;
}

/** Invalida a URL antiga imediatamente. */
export async function regenerateIntegrationToken(
  integrationId: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("platform_integrations")
    .update({
      token:
        crypto.randomUUID().replace(/-/g, "") +
        crypto.randomUUID().replace(/-/g, ""),
    })
    .eq("id", integrationId)
    .select("token")
    .single();

  if (error || !data) return null;
  return data.token;
}

export async function deleteIntegration(
  integrationId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_integrations")
    .delete()
    .eq("id", integrationId);

  return !error;
}

// --- Mapeamento ------------------------------------------------------------

/**
 * Preview do mapeamento usando a MESMA função SQL da execução real — o que o
 * admin vê aqui é exatamente o que vai acontecer quando o evento chegar.
 */
export async function previewMapping(params: {
  mapping: unknown;
  payload: unknown;
  kind: IntegrationKind;
}): Promise<MappingPreview | null> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("integration_apply_mapping", {
    p_mapping: params.mapping as Json,
    p_payload: params.payload as Json,
    p_kind: params.kind,
  });

  if (error || !data) return null;
  return data as unknown as MappingPreview;
}

export async function reprocessEvent(
  eventId: string,
): Promise<{ success: boolean; status?: string; error?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("integration_reprocess_event", {
    p_event_id: eventId,
  });

  if (error) return { success: false, error: error.message };

  const result = data as unknown as { status?: string; error?: string } | null;

  // `needs_user` exige criar a conta — o reprocessamento pelo painel faz isso
  // na action, que tem acesso à Admin API do Auth.
  return { success: true, status: result?.status };
}

export async function getEventRow(eventId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("platform_integration_events")
    .select("id, integration_id, status, resolved, payload")
    .eq("id", eventId)
    .maybeSingle();

  return data;
}

export async function finalizePurchaseForUser(
  eventId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error } = await admin.rpc("integration_finalize_purchase", {
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markEventFailed(
  eventId: string,
  message: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("integration_mark_failed", {
    p_event_id: eventId,
    p_message: message,
  });
}
