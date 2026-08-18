"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { AUDIT_ACTIONS } from "@/domains/admin/constants/admin.constants";
import {
  planFormSchema,
  planIdParamSchema,
  planUpdateSchema,
} from "@/domains/admin/schemas/admin-plan.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import {
  countActiveSubscribersForPlan,
  createPlan,
  findConflictingExternalReferences,
  getPlanRow,
  planIdExists,
  setPlanActive,
  updatePlan,
} from "@/domains/admin/services/admin-plans.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";
import type { PlanLimits } from "@/domains/billing/types/plan.types";

function revalidatePlans() {
  revalidatePath(ROUTES.admin.plans);
  revalidatePath(ROUTES.admin.root);
  revalidatePath(ROUTES.dashboardPlan);
}

function toLimits(input: {
  maxQuizzes: number;
  maxTeamMembers: number;
  maxCustomDomains: number;
}): PlanLimits {
  return {
    max_quizzes: input.maxQuizzes,
    max_team_members: input.maxTeamMembers,
    max_custom_domains: input.maxCustomDomains,
  };
}

function normalizeUrl(value: string | null): string | null {
  if (!value || value.trim().length === 0) return null;
  return value.trim();
}

/**
 * O evento de compra só traz o código externo. Se dois planos dividissem o
 * mesmo código, não daria para saber qual liberar — então o conflito é
 * bloqueado na origem.
 */
async function checkExternalReferences(
  references: string[],
  excludePlanId?: string,
): Promise<AdminActionResult | null> {
  const conflicts = await findConflictingExternalReferences(
    references,
    excludePlanId,
  );

  if (conflicts.length === 0) return null;

  const detail = conflicts
    .map((c) => `"${c.reference}" já pertence ao plano ${c.planName}`)
    .join("; ");

  return {
    success: false,
    error: `Referência externa duplicada: ${detail}.`,
    fieldErrors: { externalReferences: [detail] },
  };
}

export async function createPlanAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = planFormSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  if (await planIdExists(parsed.data.id)) {
    return {
      success: false,
      error: "Já existe um plano com esse identificador",
      fieldErrors: { id: ["Identificador já utilizado"] },
    };
  }

  const conflict = await checkExternalReferences(
    parsed.data.externalReferences,
  );
  if (conflict) return conflict;

  const created = await createPlan({
    id: parsed.data.id,
    name: parsed.data.name,
    description: parsed.data.description,
    limits: toLimits(parsed.data),
    priceCents: parsed.data.priceCents,
    checkoutUrl: normalizeUrl(parsed.data.checkoutUrl),
    externalReferences: parsed.data.externalReferences,
    isActive: parsed.data.isActive,
    sortOrder: parsed.data.sortOrder,
  });

  if (!created) return failure("Não foi possível criar o plano.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.planCreated,
    entityType: "plan",
    entityId: parsed.data.id,
    entityLabel: parsed.data.name,
    summary: `Criou o plano "${parsed.data.name}" (${parsed.data.id})`,
    metadata: {
      limits: toLimits(parsed.data),
      priceCents: parsed.data.priceCents,
      externalReferences: parsed.data.externalReferences,
    },
  });

  revalidatePlans();
  return { success: true };
}

export async function updatePlanAction(
  planId: string,
  data: unknown,
): Promise<AdminActionResult> {
  const parsedId = planIdParamSchema.safeParse({ planId });
  if (!parsedId.success) return invalid(parsedId.error);

  const parsed = planUpdateSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const existing = await getPlanRow(planId);
  if (!existing) return failure("Plano não encontrado.");

  const conflict = await checkExternalReferences(
    parsed.data.externalReferences,
    planId,
  );
  if (conflict) return conflict;

  const updated = await updatePlan(planId, {
    name: parsed.data.name,
    description: parsed.data.description,
    limits: toLimits(parsed.data),
    priceCents: parsed.data.priceCents,
    checkoutUrl: normalizeUrl(parsed.data.checkoutUrl),
    externalReferences: parsed.data.externalReferences,
    isActive: parsed.data.isActive,
    sortOrder: parsed.data.sortOrder,
  });

  if (!updated) return failure("Não foi possível salvar o plano.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.planUpdated,
    entityType: "plan",
    entityId: planId,
    entityLabel: parsed.data.name,
    summary: `Atualizou o plano "${parsed.data.name}"`,
    metadata: {
      priceCents: parsed.data.priceCents,
      limits: toLimits(parsed.data),
      isActive: parsed.data.isActive,
      externalReferences: parsed.data.externalReferences,
    },
  });

  revalidatePlans();
  return { success: true };
}

/**
 * Arquivar em vez de excluir: assinaturas e pagamentos apontam para o plano por
 * FK, e o histórico financeiro precisa continuar íntegro.
 */
export async function setPlanActiveAction(
  planId: string,
  isActive: boolean,
): Promise<AdminActionResult> {
  const parsedId = planIdParamSchema.safeParse({ planId });
  if (!parsedId.success) return invalid(parsedId.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const existing = await getPlanRow(planId);
  if (!existing) return failure("Plano não encontrado.");

  if (!isActive) {
    const activeSubscribers = await countActiveSubscribersForPlan(planId);
    if (activeSubscribers > 0) {
      return failure(
        `Este plano tem ${activeSubscribers} assinatura(s) ativa(s). Migre esses workspaces antes de arquivar.`,
      );
    }
  }

  const updated = await setPlanActive(planId, isActive);
  if (!updated) return failure("Não foi possível alterar o plano.");

  await recordAudit(actor, {
    action: isActive ? AUDIT_ACTIONS.planRestored : AUDIT_ACTIONS.planArchived,
    entityType: "plan",
    entityId: planId,
    entityLabel: existing.name,
    summary: `${isActive ? "Reativou" : "Arquivou"} o plano "${existing.name}"`,
  });

  revalidatePlans();
  return { success: true };
}
