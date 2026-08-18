"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import {
  AUDIT_ACTIONS,
  INTEGRATION_KIND_LABELS,
} from "@/domains/admin/constants/admin.constants";
import {
  createIntegrationSchema,
  integrationEventIdSchema,
  integrationIdSchema,
  parseFieldMapping,
  updateIntegrationSchema,
} from "@/domains/admin/schemas/admin-integration.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import {
  createIntegration,
  deleteIntegration,
  finalizePurchaseForUser,
  getEventRow,
  getIntegrationDefaultPassword,
  getIntegrationRow,
  markEventFailed,
  previewMapping,
  regenerateIntegrationToken,
  reprocessEvent,
  setIntegrationEnabled,
  updateIntegration,
} from "@/domains/admin/services/admin-integrations.service";
import { createUserAccount } from "@/domains/admin/services/admin-users.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import type {
  IntegrationKind,
  MappingPreview,
} from "@/domains/admin/types/integration.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";

function revalidateIntegration(integrationId?: string) {
  revalidatePath(ROUTES.admin.integrations);
  revalidatePath(ROUTES.admin.root);
  if (integrationId) {
    revalidatePath(ROUTES.admin.integration(integrationId));
  }
}

export async function createIntegrationAction(
  data: unknown,
): Promise<AdminActionResult<{ integrationId: string }>> {
  const parsed = createIntegrationSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const result = await createIntegration({
    name: parsed.data.name,
    kind: parsed.data.kind,
    providerSlug: parsed.data.providerSlug,
    createdBy: actor.id,
  });

  if (!result.success || !result.id) {
    return failure(result.error ?? "Não foi possível criar a integração.");
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.integrationCreated,
    entityType: "integration",
    entityId: result.id,
    entityLabel: parsed.data.name,
    summary: `Criou a integração "${parsed.data.name}" (${INTEGRATION_KIND_LABELS[parsed.data.kind]})`,
    metadata: {
      kind: parsed.data.kind,
      providerSlug: parsed.data.providerSlug,
    },
  });

  revalidateIntegration(result.id);
  return { success: true, data: { integrationId: result.id } };
}

export async function updateIntegrationAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = updateIntegrationSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const integration = await getIntegrationRow(parsed.data.integrationId);
  if (!integration) return failure("Integração não encontrada.");

  // Mapeamento vazio é válido: significa "ainda coletando o evento de teste".
  const rawMapping = parsed.data.fieldMapping;
  const isEmptyMapping =
    !rawMapping ||
    (typeof rawMapping === "object" &&
      Object.keys(rawMapping as object).length === 0);

  let mapping: unknown = {};

  if (!isEmptyMapping) {
    const parsedMapping = parseFieldMapping(integration.kind, rawMapping);
    if (!parsedMapping.success) {
      return {
        success: false,
        error: "Verifique o mapeamento de campos",
        fieldErrors: parsedMapping.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }
    mapping = parsedMapping.data;
  }

  // Ativar sem mapeamento deixaria a integração recebendo eventos sem fazer
  // nada — melhor recusar do que falhar silenciosamente em produção.
  if (parsed.data.enabled && isEmptyMapping) {
    return failure("Configure o mapeamento de campos antes de ativar.");
  }

  const updated = await updateIntegration(parsed.data.integrationId, {
    name: parsed.data.name,
    providerSlug: parsed.data.providerSlug,
    enabled: parsed.data.enabled,
    fieldMapping: mapping,
    defaultPassword: parsed.data.defaultPassword,
  });

  if (!updated) return failure("Não foi possível salvar a integração.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.integrationUpdated,
    entityType: "integration",
    entityId: parsed.data.integrationId,
    entityLabel: parsed.data.name,
    summary: `Atualizou a integração "${parsed.data.name}"`,
    metadata: {
      enabled: parsed.data.enabled,
      providerSlug: parsed.data.providerSlug,
      passwordChanged: parsed.data.defaultPassword !== null,
    },
  });

  revalidateIntegration(parsed.data.integrationId);
  return { success: true };
}

export async function toggleIntegrationAction(
  integrationId: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  const parsed = integrationIdSchema.safeParse({ integrationId });
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const integration = await getIntegrationRow(integrationId);
  if (!integration) return failure("Integração não encontrada.");

  const updated = await setIntegrationEnabled(integrationId, enabled);
  if (!updated) return failure("Não foi possível alterar a integração.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.integrationToggled,
    entityType: "integration",
    entityId: integrationId,
    entityLabel: integration.name,
    summary: `${enabled ? "Ativou" : "Desativou"} a integração "${integration.name}"`,
  });

  revalidateIntegration(integrationId);
  return { success: true };
}

/** Regenerar invalida a URL antiga na hora — a plataforma precisa ser atualizada. */
export async function regenerateIntegrationTokenAction(
  integrationId: string,
): Promise<AdminActionResult> {
  const parsed = integrationIdSchema.safeParse({ integrationId });
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const integration = await getIntegrationRow(integrationId);
  if (!integration) return failure("Integração não encontrada.");

  const token = await regenerateIntegrationToken(integrationId);
  if (!token) return failure("Não foi possível gerar uma nova URL.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.integrationTokenRegenerated,
    entityType: "integration",
    entityId: integrationId,
    entityLabel: integration.name,
    summary: `Regenerou a URL da integração "${integration.name}"`,
  });

  revalidateIntegration(integrationId);
  return { success: true };
}

export async function deleteIntegrationAction(
  integrationId: string,
): Promise<AdminActionResult> {
  const parsed = integrationIdSchema.safeParse({ integrationId });
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const integration = await getIntegrationRow(integrationId);
  if (!integration) return failure("Integração não encontrada.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.integrationDeleted,
    entityType: "integration",
    entityId: integrationId,
    entityLabel: integration.name,
    summary: `Excluiu a integração "${integration.name}" e seu histórico de eventos`,
  });

  const deleted = await deleteIntegration(integrationId);
  if (!deleted) return failure("Não foi possível excluir a integração.");

  revalidateIntegration();
  return { success: true };
}

export async function previewMappingAction(params: {
  mapping: unknown;
  payload: unknown;
  kind: IntegrationKind;
}): Promise<AdminActionResult<MappingPreview>> {
  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;

  const preview = await previewMapping(params);
  if (!preview) return failure("Não foi possível avaliar o mapeamento.");

  return { success: true, data: preview };
}

/**
 * Reprocessa um evento. Espelha o que a Edge Function faz: quando a ingestão
 * pede um usuário novo, cria a conta aqui (o painel tem a Admin API do Auth) e
 * finaliza.
 */
export async function reprocessEventAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = integrationEventIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const event = await getEventRow(parsed.data.eventId);
  if (!event) return failure("Evento não encontrado.");

  const result = await reprocessEvent(parsed.data.eventId);
  if (!result.success) {
    return failure(result.error ?? "Falha ao reprocessar o evento.");
  }

  if (result.status === "needs_user") {
    const fresh = await getEventRow(parsed.data.eventId);
    const resolvedFields = (fresh?.resolved ?? {}) as Record<string, unknown>;

    const email = String(resolvedFields.email ?? "");
    const integration = await getIntegrationRow(event.integration_id);

    if (!email || !integration) {
      await markEventFailed(parsed.data.eventId, "E-mail ausente no evento");
      return failure("Evento sem e-mail válido.");
    }

    const password = await getIntegrationDefaultPassword(event.integration_id);
    if (!password) {
      await markEventFailed(
        parsed.data.eventId,
        "Integração sem senha padrão configurada",
      );
      return failure(
        "Defina a senha padrão da integração antes de reprocessar.",
      );
    }

    const created = await createUserAccount({
      email,
      password,
      fullName: String(resolvedFields.fullName ?? email.split("@")[0]),
    });

    if (!created.success) {
      await markEventFailed(parsed.data.eventId, created.error);
      return failure(created.error);
    }

    const finalized = await finalizePurchaseForUser(
      parsed.data.eventId,
      created.userId,
    );

    if (!finalized.success) {
      return failure(finalized.error ?? "Falha ao aplicar a assinatura.");
    }
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.integrationEventReprocessed,
    entityType: "integration",
    entityId: event.integration_id,
    summary: `Reprocessou o evento ${parsed.data.eventId}`,
    metadata: { eventId: parsed.data.eventId, status: result.status },
  });

  revalidateIntegration(event.integration_id);
  return { success: true };
}
