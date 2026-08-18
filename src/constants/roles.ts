export const ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.OWNER]: "Proprietário",
  [ROLES.ADMIN]: "Administrador",
  [ROLES.EDITOR]: "Editor",
  [ROLES.VIEWER]: "Visualizador",
};
