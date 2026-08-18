"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { AUDIT_ACTIONS } from "@/domains/admin/constants/admin.constants";
import {
  extendSubscriptionSchema,
  grantSubscriptionSchema,
  workspaceIdSchema,
} from "@/domains/admin/schemas/admin-subscription.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import { getPlanRow } from "@/domains/admin/services/admin-plans.service";
import {
  cancelSubscription,
  extendSubscription,
  getSubscriptionForWorkspace,
  runExpireOverdueSubscriptions,
  upsertSubscription,
} from "@/domains/admin/services/admin-subscriptions.service";
import { getWorkspaceDetail } from "@/domains/admin/services/admin-workspaces.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";

function revalidateSubscriptions(workspaceId: string) {
  revalidatePath(ROUTES.admin.subscriptions);
  revalidatePath(ROUTES.admin.workspace(workspaceId));
  revalidatePath(ROUTES.admin.workspaces);
  revalidatePath(ROUTES.admin.root);
}

/** Converte AAAA-MM-DD em ISO no início do dia UTC. */
function toIsoDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export async function grantSubscriptionAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = grantSubscriptionSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const plan = await getPlanRow(parsed.data.planId);
  if (!plan) return failure("Plano não encontrado.");

  const previous = await getSubscriptionForWorkspace(parsed.data.workspaceId);

  const saved = await upsertSubscription({
    workspaceId: parsed.data.workspaceId,
    planId: parsed.data.planId,
    status: parsed.data.status,
    periodStart: toIsoDate(parsed.data.periodStart),
    periodEnd: toIsoDate(parsed.data.periodEnd),
  });

  if (!saved) return failure("Não foi possível salvar a assinatura.");

  await recordAudit(actor, {
    action: previous
      ? AUDIT_ACTIONS.subscriptionUpdated
      : AUDIT_ACTIONS.subscriptionGranted,
    entityType: "subscription",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `${previous ? "Atualizou" : "Concedeu"} assinatura ${plan.name} (${parsed.data.status}) em "${detail.workspace.name}"`,
    metadata: {
      planId: parsed.data.planId,
      status: parsed.data.status,
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      previousPlanId: previous?.planId ?? null,
      previousStatus: previous?.status ?? null,
    },
  });

  revalidateSubscriptions(parsed.data.workspaceId);
  return { success: true };
}

export async function extendSubscriptionAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = extendSubscriptionSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const result = await extendSubscription(
    parsed.data.workspaceId,
    parsed.data.days,
  );
  if (!result.success) {
    return failure(result.error ?? "Não foi possível estender a assinatura.");
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.subscriptionExtended,
    entityType: "subscription",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `Estendeu a assinatura de "${detail.workspace.name}" em ${parsed.data.days} dia(s)`,
    metadata: { days: parsed.data.days, newPeriodEnd: result.newPeriodEnd },
  });

  revalidateSubscriptions(parsed.data.workspaceId);
  return { success: true };
}

export async function cancelSubscriptionAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = workspaceIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const canceled = await cancelSubscription(parsed.data.workspaceId);
  if (!canceled) return failure("Não foi possível cancelar a assinatura.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.subscriptionCanceled,
    entityType: "subscription",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `Cancelou a assinatura de "${detail.workspace.name}"`,
  });

  revalidateSubscriptions(parsed.data.workspaceId);
  return { success: true };
}

/** Executa manualmente a rotina que marca assinaturas vencidas. */
export async function runExpireOverdueSubscriptionsAction(): Promise<
  AdminActionResult<{ result: unknown }>
> {
  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const outcome = await runExpireOverdueSubscriptions();
  if (!outcome.success) return failure("A rotina falhou. Verifique os logs.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.subscriptionsExpired,
    entityType: "job",
    entityId: "expire_overdue_subscriptions",
    summary: "Executou a rotina de expiração de assinaturas",
    metadata: { result: outcome.result },
  });

  revalidatePath(ROUTES.admin.subscriptions);
  revalidatePath(ROUTES.admin.root);
  return { success: true, data: { result: outcome.result } };
}
