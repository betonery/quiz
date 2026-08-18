import type { WorkspaceRole } from "@/domains/workspace/types/workspace.types";

export function canManageWorkspaceTeam(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "admin";
}

export function formatWorkspaceOwnerLabel(params: {
  ownerName: string;
  ownerId: string;
  currentUserId: string;
}): string {
  if (params.ownerId === params.currentUserId) {
    return "Você é o proprietário";
  }

  return `Dono: ${params.ownerName}`;
}

export function getWorkspaceOwnerDisplayName(owner: {
  full_name: string | null;
  email: string;
}): string {
  return owner.full_name?.trim() || owner.email.split("@")[0] || "Usuário";
}
