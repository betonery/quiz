"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACTIVE_WORKSPACE_COOKIE } from "@/constants/workspace";
import { ROUTES } from "@/constants/routes";
import { updateWorkspaceNameSchema } from "@/domains/workspace/schemas/update-workspace-name.schema";
import {
  acceptWorkspaceInvitation,
  getUserRoleInWorkspace,
  getWorkspaceBySlug,
  inviteWorkspaceMember,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  revokeWorkspaceInvitation,
  updateWorkspaceName,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { canManageWorkspaceTeam } from "@/domains/workspace/utils/workspace.utils";
import type { InviteRole } from "@/domains/workspace/types/workspace.types";
import { createClient } from "@/services/supabase/server";

async function requireWorkspaceAdmin(workspaceSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Usuário não autenticado" as const };
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    return { error: "Workspace não encontrado" as const };
  }

  const role = await getUserRoleInWorkspace(user.id, workspace.id);
  if (!canManageWorkspaceTeam(role)) {
    return { error: "Sem permissão para gerenciar equipe" as const };
  }

  return { user, workspace, role } as const;
}

export async function setActiveWorkspaceCookieAction(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function inviteWorkspaceMemberAction(
  workspaceSlug: string,
  email: string,
  role: InviteRole,
) {
  const ctx = await requireWorkspaceAdmin(workspaceSlug);
  if ("error" in ctx) return { success: false as const, error: ctx.error };

  return inviteWorkspaceMember({
    workspaceId: ctx.workspace.id,
    email,
    role,
    invitedBy: ctx.user.id,
  });
}

export async function revokeWorkspaceInvitationAction(
  workspaceSlug: string,
  invitationId: string,
) {
  const ctx = await requireWorkspaceAdmin(workspaceSlug);
  if ("error" in ctx) return { success: false as const, error: ctx.error };

  return revokeWorkspaceInvitation(invitationId, ctx.workspace.id);
}

export async function getWorkspaceTeamDataAction(workspaceSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Usuário não autenticado" };
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    return { success: false as const, error: "Workspace não encontrado" };
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) {
    return { success: false as const, error: "Sem acesso ao workspace" };
  }

  const role = await getUserRoleInWorkspace(user.id, workspace.id);
  const canManage = canManageWorkspaceTeam(role);

  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(workspace.id),
    canManage ? listWorkspaceInvitations(workspace.id) : Promise.resolve([]),
  ]);

  return {
    success: true as const,
    workspace,
    role,
    canManage,
    members,
    invitations,
  };
}

export async function acceptWorkspaceInvitationAction(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Usuário não autenticado" };
  }

  const result = await acceptWorkspaceInvitation(token);
  if (!result.success) {
    return result;
  }

  await setActiveWorkspaceCookieAction(result.workspaceSlug);
  return result;
}

export async function updateWorkspaceNameAction(
  workspaceSlug: string,
  data: unknown,
) {
  const parsed = updateWorkspaceNameSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false as const,
      error: "Verifique o nome do workspace",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const ctx = await requireWorkspaceAdmin(workspaceSlug);
  if ("error" in ctx) {
    return { success: false as const, error: ctx.error };
  }

  const result = await updateWorkspaceName(ctx.workspace.id, parsed.data.name);
  if (!result.success) {
    return result;
  }

  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.settings(workspaceSlug));

  return { success: true as const };
}
