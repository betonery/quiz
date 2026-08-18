"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import {
  AUDIT_ACTIONS,
  PLATFORM_ROLE_LABELS,
} from "@/domains/admin/constants/admin.constants";
import {
  changePlatformRoleSchema,
  createUserSchema,
  suspendUserSchema,
  updateInternalNotesSchema,
  userIdSchema,
} from "@/domains/admin/schemas/admin-user.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import {
  resolveAdminActor,
  resolveAdminWriter,
} from "@/domains/admin/services/admin-guard.service";
import { getPlanRow } from "@/domains/admin/services/admin-plans.service";
import { upsertSubscription } from "@/domains/admin/services/admin-subscriptions.service";
import {
  confirmUserEmail,
  countPlatformAdmins,
  createUserAccount,
  deleteUserAccount,
  generatePasswordResetLink,
  getUserProfileRow,
  reinstateUser,
  suspendUser,
  updateInternalNotes,
  updatePlatformRole,
} from "@/domains/admin/services/admin-users.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  evaluateRoleChange,
  evaluateUserDeletion,
  evaluateUserSuspension,
  parsePlatformRole,
} from "@/domains/admin/utils/admin-access.utils";
import { invalidResult as invalid } from "@/domains/admin/utils/admin-action.utils";

function revalidateUser(userId: string) {
  revalidatePath(ROUTES.admin.users);
  revalidatePath(ROUTES.admin.user(userId));
  revalidatePath(ROUTES.admin.root);
}

/**
 * Cria a conta pelo painel e, opcionalmente, já concede a assinatura.
 *
 * O usuário nasce com e-mail confirmado e senha definida — a ideia é entregar
 * o acesso pronto, sem depender do fluxo de confirmação por e-mail.
 */
export async function createUserAction(
  data: unknown,
): Promise<AdminActionResult<{ userId: string }>> {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const planId = parsed.data.planId.trim();
  const plan = planId ? await getPlanRow(planId) : null;

  if (planId && !plan) {
    return {
      success: false,
      error: "Plano não encontrado",
      fieldErrors: { planId: ["Plano não encontrado"] },
    };
  }

  const created = await createUserAccount({
    email: parsed.data.email,
    password: parsed.data.password,
    fullName: parsed.data.fullName,
  });

  if (!created.success) {
    return {
      success: false,
      error: created.error,
      fieldErrors: /e-mail/i.test(created.error)
        ? { email: [created.error] }
        : undefined,
    };
  }

  let subscriptionWarning: string | null = null;

  if (plan) {
    if (created.workspaceId) {
      const periodStart = new Date();
      const periodEnd = new Date(periodStart.getTime());
      periodEnd.setDate(periodEnd.getDate() + parsed.data.accessDays);

      const granted = await upsertSubscription({
        workspaceId: created.workspaceId,
        planId: plan.id,
        status: "active",
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });

      if (!granted) {
        subscriptionWarning =
          "Usuário criado, mas a assinatura não pôde ser aplicada.";
      }
    } else {
      subscriptionWarning =
        "Usuário criado, mas o workspace não foi encontrado para aplicar o plano.";
    }
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userCreated,
    entityType: "user",
    entityId: created.userId,
    entityLabel: parsed.data.email,
    summary: plan
      ? `Criou a conta ${parsed.data.email} com o plano ${plan.name} por ${parsed.data.accessDays} dia(s)`
      : `Criou a conta ${parsed.data.email} sem assinatura`,
    metadata: {
      planId: plan?.id ?? null,
      accessDays: plan ? parsed.data.accessDays : null,
      workspaceId: created.workspaceId,
      subscriptionWarning,
    },
  });

  revalidatePath(ROUTES.admin.users);
  revalidatePath(ROUTES.admin.workspaces);
  revalidatePath(ROUTES.admin.root);

  // A conta existe: reportar erro aqui faria o admin tentar criar de novo e
  // esbarrar em "e-mail já cadastrado". O aviso vai como falha parcial.
  if (subscriptionWarning) {
    return { success: false, error: subscriptionWarning };
  }

  return { success: true, data: { userId: created.userId } };
}

export async function changePlatformRoleAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = changePlatformRoleSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const targetRole = parsePlatformRole(target.platform_role);
  const adminCount = await countPlatformAdmins();

  const check = evaluateRoleChange({
    actorId: actor.id,
    actorRole: actor.role,
    targetId: target.id,
    targetRole,
    nextRole: parsed.data.role,
    currentAdminCount: adminCount,
  });

  if (!check.allowed) return { success: false, error: check.reason };

  const updated = await updatePlatformRole(target.id, parsed.data.role);
  if (!updated) {
    return { success: false, error: "Não foi possível alterar o papel." };
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userRoleChanged,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `${target.email}: ${PLATFORM_ROLE_LABELS[targetRole]} → ${PLATFORM_ROLE_LABELS[parsed.data.role]}`,
    metadata: { from: targetRole, to: parsed.data.role },
  });

  revalidateUser(target.id);
  return { success: true };
}

export async function suspendUserAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = suspendUserSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const check = evaluateUserSuspension({
    actorId: actor.id,
    actorRole: actor.role,
    targetId: parsed.data.userId,
  });
  if (!check.allowed) return { success: false, error: check.reason };

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const suspended = await suspendUser(target.id, parsed.data.reason);
  if (!suspended) {
    return { success: false, error: "Não foi possível suspender o usuário." };
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userSuspended,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `Suspendeu ${target.email}: ${parsed.data.reason}`,
    metadata: { reason: parsed.data.reason },
  });

  revalidateUser(target.id);
  return { success: true };
}

export async function reinstateUserAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = userIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const reinstated = await reinstateUser(target.id);
  if (!reinstated) {
    return { success: false, error: "Não foi possível reativar o usuário." };
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userReinstated,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `Reativou ${target.email}`,
  });

  revalidateUser(target.id);
  return { success: true };
}

export async function confirmUserEmailAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = userIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const confirmed = await confirmUserEmail(target.id);
  if (!confirmed) {
    return { success: false, error: "Não foi possível confirmar o e-mail." };
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userEmailConfirmed,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `Confirmou manualmente o e-mail de ${target.email}`,
  });

  revalidateUser(target.id);
  return { success: true };
}

/**
 * Devolve o link de recuperação para o admin repassar ao usuário.
 * O link é um credencial de uso único — por isso a ação fica registrada.
 */
export async function generatePasswordResetLinkAction(
  data: unknown,
): Promise<AdminActionResult<{ link: string }>> {
  const parsed = userIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const link = await generatePasswordResetLink(target.email);
  if (!link) {
    return { success: false, error: "Não foi possível gerar o link." };
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userPasswordReset,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `Gerou link de redefinição de senha para ${target.email}`,
  });

  return { success: true, data: { link } };
}

export async function updateInternalNotesAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = updateInternalNotesSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const notes = parsed.data.notes.length > 0 ? parsed.data.notes : null;
  const updated = await updateInternalNotes(target.id, notes);
  if (!updated) {
    return { success: false, error: "Não foi possível salvar as notas." };
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userNotesUpdated,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `Atualizou notas internas de ${target.email}`,
  });

  revalidateUser(target.id);
  return { success: true };
}

/**
 * Exclusão definitiva. O cascade de `auth.users → profiles` derruba workspaces,
 * funis e pagamentos do usuário — daí a confirmação por digitação na UI.
 */
export async function deleteUserAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = userIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const target = await getUserProfileRow(parsed.data.userId);
  if (!target) return { success: false, error: "Usuário não encontrado." };

  const check = evaluateUserDeletion({
    actorId: actor.id,
    actorRole: actor.role,
    targetId: target.id,
    targetRole: parsePlatformRole(target.platform_role),
    currentAdminCount: await countPlatformAdmins(),
  });
  if (!check.allowed) return { success: false, error: check.reason };

  // Auditoria antes da exclusão: depois do cascade o e-mail some do banco.
  await recordAudit(actor, {
    action: AUDIT_ACTIONS.userDeleted,
    entityType: "user",
    entityId: target.id,
    entityLabel: target.email,
    summary: `Excluiu a conta ${target.email}`,
    metadata: { platform_role: target.platform_role },
  });

  const deleted = await deleteUserAccount(target.id);
  if (!deleted) {
    return { success: false, error: "Não foi possível excluir o usuário." };
  }

  revalidatePath(ROUTES.admin.users);
  revalidatePath(ROUTES.admin.root);
  return { success: true };
}

/** Usada pela UI para confirmar que a sessão ainda tem acesso ao painel. */
export async function pingAdminSessionAction(): Promise<AdminActionResult> {
  const resolved = await resolveAdminActor();
  if (!resolved.ok) return resolved.result;
  return { success: true };
}
