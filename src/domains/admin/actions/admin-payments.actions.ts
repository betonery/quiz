"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { AUDIT_ACTIONS } from "@/domains/admin/constants/admin.constants";
import {
  manualPaymentSchema,
  refundPaymentSchema,
} from "@/domains/admin/schemas/admin-payment.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import {
  getPaymentRow,
  recordManualPayment,
  refundPayment,
} from "@/domains/admin/services/admin-payments.service";
import { getPlanRow } from "@/domains/admin/services/admin-plans.service";
import { upsertSubscription } from "@/domains/admin/services/admin-subscriptions.service";
import { getWorkspaceDetail } from "@/domains/admin/services/admin-workspaces.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";
import { formatCents } from "@/domains/admin/utils/admin-format.utils";

function revalidatePayments(workspaceId?: string) {
  revalidatePath(ROUTES.admin.payments);
  revalidatePath(ROUTES.admin.subscriptions);
  revalidatePath(ROUTES.admin.root);
  if (workspaceId) revalidatePath(ROUTES.admin.workspace(workspaceId));
}

function toIsoDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export async function recordManualPaymentAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = manualPaymentSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const plan = await getPlanRow(parsed.data.planId);
  if (!plan) return failure("Plano não encontrado.");

  const periodStart = toIsoDate(parsed.data.periodStart);
  const periodEnd = toIsoDate(parsed.data.periodEnd);

  const result = await recordManualPayment({
    workspaceId: parsed.data.workspaceId,
    planId: parsed.data.planId,
    amountCents: parsed.data.amountCents,
    paymentMethod: parsed.data.paymentMethod,
    periodStart,
    periodEnd,
    externalPaymentId: parsed.data.externalPaymentId,
    actorEmail: actor.email,
  });

  if (!result.success) {
    return failure(result.error ?? "Não foi possível registrar o pagamento.");
  }

  if (parsed.data.activateSubscription) {
    await upsertSubscription({
      workspaceId: parsed.data.workspaceId,
      planId: parsed.data.planId,
      status: "active",
      periodStart,
      periodEnd,
    });
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.paymentRecorded,
    entityType: "payment",
    entityId: result.paymentId ?? parsed.data.externalPaymentId,
    entityLabel: detail.workspace.slug,
    summary: `Lançou ${formatCents(parsed.data.amountCents)} (${parsed.data.paymentMethod}) para "${detail.workspace.name}"`,
    metadata: {
      workspaceId: parsed.data.workspaceId,
      planId: parsed.data.planId,
      amountCents: parsed.data.amountCents,
      activatedSubscription: parsed.data.activateSubscription,
    },
  });

  revalidatePayments(parsed.data.workspaceId);
  return { success: true };
}

export async function refundPaymentAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = refundPaymentSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const payment = await getPaymentRow(parsed.data.paymentId);
  if (!payment) return failure("Pagamento não encontrado.");

  if (payment.status === "refunded") {
    return failure("Este pagamento já foi reembolsado.");
  }

  const result = await refundPayment(payment.id, payment.workspace_id);
  if (!result.success) {
    return failure(result.error ?? "Não foi possível reembolsar o pagamento.");
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.paymentRefunded,
    entityType: "payment",
    entityId: payment.id,
    entityLabel: payment.external_payment_id,
    summary: `Reembolsou ${formatCents(payment.amount_cents)} (${payment.external_payment_id})`,
    metadata: {
      workspaceId: payment.workspace_id,
      amountCents: payment.amount_cents,
    },
  });

  revalidatePayments(payment.workspace_id);
  return { success: true };
}
