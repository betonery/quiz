import {
  PLATFORM_ROLES,
  type PlatformRole,
} from "@/domains/admin/constants/admin.constants";

export function parsePlatformRole(value: unknown): PlatformRole {
  if (
    value === PLATFORM_ROLES.ADMIN ||
    value === PLATFORM_ROLES.SUPPORT ||
    value === PLATFORM_ROLES.USER
  ) {
    return value;
  }
  return PLATFORM_ROLES.USER;
}

/** Admin: acesso total de escrita. */
export function isPlatformAdmin(role: PlatformRole): boolean {
  return role === PLATFORM_ROLES.ADMIN;
}

/** Staff: admin ou suporte — quem pode abrir o painel. */
export function isPlatformStaff(role: PlatformRole): boolean {
  return role === PLATFORM_ROLES.ADMIN || role === PLATFORM_ROLES.SUPPORT;
}

export function canAccessAdminPanel(role: PlatformRole): boolean {
  return isPlatformStaff(role);
}

export function canWriteAdminPanel(role: PlatformRole): boolean {
  return isPlatformAdmin(role);
}

/**
 * Um admin não pode se rebaixar sozinho — isso deixaria a plataforma sem
 * ninguém capaz de reverter, e um clique errado viraria um lockout permanente.
 */
export function canChangeOwnRole(actorId: string, targetId: string): boolean {
  return actorId !== targetId;
}

/**
 * Também não se remove o último admin: a checagem roda antes de qualquer
 * rebaixamento ou exclusão de conta.
 */
export function wouldRemoveLastAdmin(params: {
  currentAdminCount: number;
  targetIsAdmin: boolean;
  nextRoleIsAdmin: boolean;
}): boolean {
  if (!params.targetIsAdmin) return false;
  if (params.nextRoleIsAdmin) return false;
  return params.currentAdminCount <= 1;
}

export type RoleChangeCheck =
  | { allowed: true }
  | { allowed: false; reason: string };

export function evaluateRoleChange(params: {
  actorId: string;
  actorRole: PlatformRole;
  targetId: string;
  targetRole: PlatformRole;
  nextRole: PlatformRole;
  currentAdminCount: number;
}): RoleChangeCheck {
  if (!isPlatformAdmin(params.actorRole)) {
    return { allowed: false, reason: "Apenas administradores alteram papéis." };
  }

  if (!canChangeOwnRole(params.actorId, params.targetId)) {
    return {
      allowed: false,
      reason: "Você não pode alterar o próprio papel de plataforma.",
    };
  }

  if (params.targetRole === params.nextRole) {
    return { allowed: false, reason: "O usuário já possui esse papel." };
  }

  if (
    wouldRemoveLastAdmin({
      currentAdminCount: params.currentAdminCount,
      targetIsAdmin: isPlatformAdmin(params.targetRole),
      nextRoleIsAdmin: isPlatformAdmin(params.nextRole),
    })
  ) {
    return {
      allowed: false,
      reason: "A plataforma precisa de pelo menos um administrador.",
    };
  }

  return { allowed: true };
}

export type DestructiveCheck =
  | { allowed: true }
  | { allowed: false; reason: string };

export function evaluateUserDeletion(params: {
  actorId: string;
  actorRole: PlatformRole;
  targetId: string;
  targetRole: PlatformRole;
  currentAdminCount: number;
}): DestructiveCheck {
  if (!isPlatformAdmin(params.actorRole)) {
    return {
      allowed: false,
      reason: "Apenas administradores podem excluir usuários.",
    };
  }

  if (params.actorId === params.targetId) {
    return { allowed: false, reason: "Você não pode excluir a própria conta." };
  }

  if (
    wouldRemoveLastAdmin({
      currentAdminCount: params.currentAdminCount,
      targetIsAdmin: isPlatformAdmin(params.targetRole),
      nextRoleIsAdmin: false,
    })
  ) {
    return {
      allowed: false,
      reason: "A plataforma precisa de pelo menos um administrador.",
    };
  }

  return { allowed: true };
}

export function evaluateUserSuspension(params: {
  actorId: string;
  actorRole: PlatformRole;
  targetId: string;
}): DestructiveCheck {
  if (!isPlatformAdmin(params.actorRole)) {
    return {
      allowed: false,
      reason: "Apenas administradores podem suspender usuários.",
    };
  }

  if (params.actorId === params.targetId) {
    return { allowed: false, reason: "Você não pode suspender a si mesmo." };
  }

  return { allowed: true };
}
