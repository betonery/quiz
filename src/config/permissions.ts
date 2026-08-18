import { ROLES, type Role } from "@/constants/roles";

export const PERMISSIONS = {
  workspace: {
    read: "workspace:read",
    update: "workspace:update",
    delete: "workspace:delete",
    manageMembers: "workspace:manage_members",
  },
  quiz: {
    read: "quiz:read",
    create: "quiz:create",
    update: "quiz:update",
    delete: "quiz:delete",
    publish: "quiz:publish",
  },
  analytics: {
    read: "analytics:read",
    export: "analytics:export",
  },
  billing: {
    read: "billing:read",
    manage: "billing:manage",
  },
  integrations: {
    read: "integrations:read",
    manage: "integrations:manage",
  },
  settings: {
    read: "settings:read",
    update: "settings:update",
  },
} as const;

export type Permission = {
  [K in keyof typeof PERMISSIONS]: (typeof PERMISSIONS)[K][keyof (typeof PERMISSIONS)[K]];
}[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.OWNER]: Object.values(PERMISSIONS).flatMap((group) =>
    Object.values(group),
  ),
  [ROLES.ADMIN]: [
    PERMISSIONS.workspace.read,
    PERMISSIONS.workspace.update,
    PERMISSIONS.workspace.manageMembers,
    PERMISSIONS.quiz.read,
    PERMISSIONS.quiz.create,
    PERMISSIONS.quiz.update,
    PERMISSIONS.quiz.delete,
    PERMISSIONS.quiz.publish,
    PERMISSIONS.analytics.read,
    PERMISSIONS.analytics.export,
    PERMISSIONS.billing.read,
    PERMISSIONS.integrations.read,
    PERMISSIONS.integrations.manage,
    PERMISSIONS.settings.read,
    PERMISSIONS.settings.update,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.workspace.read,
    PERMISSIONS.quiz.read,
    PERMISSIONS.quiz.create,
    PERMISSIONS.quiz.update,
    PERMISSIONS.quiz.publish,
    PERMISSIONS.analytics.read,
    PERMISSIONS.integrations.read,
    PERMISSIONS.settings.read,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.workspace.read,
    PERMISSIONS.quiz.read,
    PERMISSIONS.analytics.read,
    PERMISSIONS.settings.read,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
