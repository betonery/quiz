"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { AUDIT_ACTIONS } from "@/domains/admin/constants/admin.constants";
import {
  renameWorkspaceSchema,
  transferOwnershipSchema,
  workspaceMemberRoleSchema,
  workspaceMemberSchema,
} from "@/domains/admin/schemas/admin-workspace.schema";
import { workspaceIdSchema } from "@/domains/admin/schemas/admin-subscription.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import {
  deleteWorkspace,
  getWorkspaceDetail,
  removeWorkspaceMember,
  renameWorkspace,
  transferWorkspaceOwnership,
  updateWorkspaceMemberRole,
} from "@/domains/admin/services/admin-workspaces.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";

function revalidateWorkspace(workspaceId: string) {
  revalidatePath(ROUTES.admin.workspaces);
  revalidatePath(ROUTES.admin.workspace(workspaceId));
  revalidatePath(ROUTES.admin.root);
}

export async function renameWorkspaceAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = renameWorkspaceSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const renamed = await renameWorkspace(
    parsed.data.workspaceId,
    parsed.data.name,
  );
  if (!renamed) return failure("Não foi possível renomear o workspace.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.workspaceRenamed,
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `Renomeou "${detail.workspace.name}" para "${parsed.data.name}"`,
    metadata: { from: detail.workspace.name, to: parsed.data.name },
  });

  revalidateWorkspace(parsed.data.workspaceId);
  return { success: true };
}

export async function transferWorkspaceOwnershipAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = transferOwnershipSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const result = await transferWorkspaceOwnership(
    parsed.data.workspaceId,
    parsed.data.newOwnerId,
  );
  if (!result.success) {
    return failure(
      result.error ?? "Não foi possível transferir a propriedade.",
    );
  }

  const newOwner = detail.members.find(
    (member) => member.userId === parsed.data.newOwnerId,
  );

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.workspaceOwnerChanged,
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `Transferiu "${detail.workspace.name}" para ${newOwner?.email ?? parsed.data.newOwnerId}`,
    metadata: {
      from: detail.workspace.ownerEmail,
      to: newOwner?.email ?? parsed.data.newOwnerId,
    },
  });

  revalidateWorkspace(parsed.data.workspaceId);
  return { success: true };
}

export async function updateWorkspaceMemberRoleAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = workspaceMemberRoleSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  // "owner" é derivado de `workspaces.owner_id`; promover por aqui deixaria
  // dois donos e o painel mostrando estados conflitantes.
  if (parsed.data.role === "owner") {
    return failure("Use a transferência de propriedade para definir o dono.");
  }

  if (detail.workspace.ownerId === parsed.data.userId) {
    return failure("Transfira a propriedade antes de rebaixar o dono.");
  }

  const updated = await updateWorkspaceMemberRole(
    parsed.data.workspaceId,
    parsed.data.userId,
    parsed.data.role,
  );
  if (!updated) return failure("Não foi possível alterar o papel do membro.");

  const member = detail.members.find((m) => m.userId === parsed.data.userId);

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.workspaceMemberRoleChanged,
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `${member?.email ?? parsed.data.userId} agora é ${parsed.data.role} em "${detail.workspace.name}"`,
    metadata: { userId: parsed.data.userId, role: parsed.data.role },
  });

  revalidateWorkspace(parsed.data.workspaceId);
  return { success: true };
}

export async function removeWorkspaceMemberAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = workspaceMemberSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  const member = detail.members.find((m) => m.userId === parsed.data.userId);

  const result = await removeWorkspaceMember(
    parsed.data.workspaceId,
    parsed.data.userId,
  );
  if (!result.success) {
    return failure(result.error ?? "Não foi possível remover o membro.");
  }

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.workspaceMemberRemoved,
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `Removeu ${member?.email ?? parsed.data.userId} de "${detail.workspace.name}"`,
  });

  revalidateWorkspace(parsed.data.workspaceId);
  return { success: true };
}

export async function deleteWorkspaceAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = workspaceIdSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const detail = await getWorkspaceDetail(parsed.data.workspaceId);
  if (!detail) return failure("Workspace não encontrado.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.workspaceDeleted,
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    entityLabel: detail.workspace.slug,
    summary: `Excluiu o workspace "${detail.workspace.name}" (${detail.workspace.quizCount} funis)`,
    metadata: {
      owner: detail.workspace.ownerEmail,
      quizCount: detail.workspace.quizCount,
      memberCount: detail.workspace.memberCount,
    },
  });

  const deleted = await deleteWorkspace(parsed.data.workspaceId);
  if (!deleted) return failure("Não foi possível excluir o workspace.");

  revalidatePath(ROUTES.admin.workspaces);
  revalidatePath(ROUTES.admin.root);
  return { success: true };
}
