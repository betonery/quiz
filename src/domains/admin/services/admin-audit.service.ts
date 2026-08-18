import "server-only";

import type {
  AdminActor,
  AdminAuditLogRow,
  AdminListParams,
  AdminListResult,
} from "@/domains/admin/types/admin.types";
import {
  buildOrIlikeFilter,
  clampPage,
  pageCountFor,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";
import { createAdminClient } from "@/services/supabase/admin";
import type { Json } from "@/types/database.types";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

/**
 * Registra a ação na trilha imutável.
 *
 * Nunca lança: uma falha de auditoria não deve desfazer uma operação que já
 * aconteceu no banco. O erro vai para o log do servidor.
 */
export async function recordAudit(
  actor: AdminActor,
  input: AuditInput,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("platform_audit_logs").insert({
      actor_id: actor.id,
      actor_email: actor.email,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      entity_label: input.entityLabel ?? null,
      summary: input.summary,
      metadata: (input.metadata ?? {}) as Json,
    });

    if (error) {
      console.error("[recordAudit] falha ao registrar auditoria", error);
    }
  } catch (error) {
    console.error("[recordAudit] erro inesperado", error);
  }
}

function mapAuditRow(row: {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  summary: string;
  metadata: Json;
  created_at: string;
}): AdminAuditLogRow {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    summary: row.summary,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  };
}

export async function listAuditLogs(
  params: AdminListParams & { action?: string; entityType?: string },
): Promise<AdminListResult<AdminAuditLogRow>> {
  const admin = createAdminClient();

  // Uma fábrica por execução: o builder do PostgREST é mutável e reaproveitá-lo
  // depois do primeiro await acumularia os filtros da chamada anterior.
  const buildQuery = () => {
    let query = admin
      .from("platform_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.search) {
      query = query.or(
        buildOrIlikeFilter(
          ["actor_email", "summary", "entity_label"],
          params.search,
        ),
      );
    }
    if (params.action) {
      query = query.eq("action", params.action);
    }
    if (params.entityType) {
      query = query.eq("entity_type", params.entityType);
    }

    return query;
  };

  const { count } = await buildQuery().range(0, 0);
  const total = count ?? 0;
  const page = clampPage(params.page, total, params.pageSize);
  const { from, to } = toRange(page, params.pageSize);

  const { data, error } = await buildQuery().range(from, to);

  if (error || !data) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params.pageSize,
      pageCount: 1,
    };
  }

  return {
    items: data.map(mapAuditRow),
    total,
    page,
    pageSize: params.pageSize,
    pageCount: pageCountFor(total, params.pageSize),
  };
}

export async function listRecentAudit(limit = 8): Promise<AdminAuditLogRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapAuditRow);
}

export async function listAuditForEntity(
  entityType: string,
  entityId: string,
  limit = 20,
): Promise<AdminAuditLogRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_audit_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapAuditRow);
}

export async function listDistinctAuditActions(): Promise<string[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_audit_logs")
    .select("action")
    .order("action", { ascending: true })
    .limit(1000);

  if (error || !data) return [];
  return [...new Set(data.map((row) => row.action))];
}
