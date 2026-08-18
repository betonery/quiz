/** Papel GLOBAL na plataforma — não confundir com `workspace_members.role`. */
export const PLATFORM_ROLES = {
  USER: "user",
  SUPPORT: "support",
  ADMIN: "admin",
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  [PLATFORM_ROLES.USER]: "Usuário",
  [PLATFORM_ROLES.SUPPORT]: "Suporte",
  [PLATFORM_ROLES.ADMIN]: "Administrador",
};

export const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  [PLATFORM_ROLES.USER]: "Sem acesso ao painel administrativo.",
  [PLATFORM_ROLES.SUPPORT]: "Acessa o painel em modo somente leitura.",
  [PLATFORM_ROLES.ADMIN]: "Acesso total: pode alterar qualquer dado.",
};

export const PLATFORM_ROLE_OPTIONS = [
  PLATFORM_ROLES.USER,
  PLATFORM_ROLES.SUPPORT,
  PLATFORM_ROLES.ADMIN,
] as const;

/** Tamanho de página padrão das listagens do painel. */
export const ADMIN_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 100;

/** Ações registradas na trilha de auditoria. */
export const AUDIT_ACTIONS = {
  userCreated: "user.created",
  userRoleChanged: "user.role_changed",
  userSuspended: "user.suspended",
  userReinstated: "user.reinstated",
  userDeleted: "user.deleted",
  userPasswordReset: "user.password_reset_sent",
  userEmailConfirmed: "user.email_confirmed",
  userNotesUpdated: "user.notes_updated",
  workspaceRenamed: "workspace.renamed",
  workspaceDeleted: "workspace.deleted",
  workspaceOwnerChanged: "workspace.owner_changed",
  workspaceMemberRemoved: "workspace.member_removed",
  workspaceMemberRoleChanged: "workspace.member_role_changed",
  planCreated: "plan.created",
  planUpdated: "plan.updated",
  planArchived: "plan.archived",
  planRestored: "plan.restored",
  subscriptionGranted: "subscription.granted",
  subscriptionUpdated: "subscription.updated",
  subscriptionCanceled: "subscription.canceled",
  subscriptionExtended: "subscription.extended",
  paymentRecorded: "payment.recorded",
  paymentRefunded: "payment.refunded",
  quizUnpublished: "quiz.unpublished",
  quizDeleted: "quiz.deleted",
  settingsUpdated: "settings.updated",
  maintenanceToggled: "settings.maintenance_toggled",
  subscriptionsExpired: "job.expire_subscriptions",
  integrationCreated: "integration.created",
  integrationUpdated: "integration.updated",
  integrationToggled: "integration.toggled",
  integrationTokenRegenerated: "integration.token_regenerated",
  integrationDeleted: "integration.deleted",
  integrationEventReprocessed: "integration.event_reprocessed",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  [AUDIT_ACTIONS.userCreated]: "Usuário criado",
  [AUDIT_ACTIONS.userRoleChanged]: "Papel alterado",
  [AUDIT_ACTIONS.userSuspended]: "Usuário suspenso",
  [AUDIT_ACTIONS.userReinstated]: "Usuário reativado",
  [AUDIT_ACTIONS.userDeleted]: "Usuário excluído",
  [AUDIT_ACTIONS.userPasswordReset]: "Reset de senha enviado",
  [AUDIT_ACTIONS.userEmailConfirmed]: "E-mail confirmado",
  [AUDIT_ACTIONS.userNotesUpdated]: "Notas internas atualizadas",
  [AUDIT_ACTIONS.workspaceRenamed]: "Workspace renomeado",
  [AUDIT_ACTIONS.workspaceDeleted]: "Workspace excluído",
  [AUDIT_ACTIONS.workspaceOwnerChanged]: "Proprietário alterado",
  [AUDIT_ACTIONS.workspaceMemberRemoved]: "Membro removido",
  [AUDIT_ACTIONS.workspaceMemberRoleChanged]: "Papel de membro alterado",
  [AUDIT_ACTIONS.planCreated]: "Plano criado",
  [AUDIT_ACTIONS.planUpdated]: "Plano atualizado",
  [AUDIT_ACTIONS.planArchived]: "Plano arquivado",
  [AUDIT_ACTIONS.planRestored]: "Plano reativado",
  [AUDIT_ACTIONS.subscriptionGranted]: "Assinatura concedida",
  [AUDIT_ACTIONS.subscriptionUpdated]: "Assinatura atualizada",
  [AUDIT_ACTIONS.subscriptionCanceled]: "Assinatura cancelada",
  [AUDIT_ACTIONS.subscriptionExtended]: "Assinatura estendida",
  [AUDIT_ACTIONS.paymentRecorded]: "Pagamento lançado",
  [AUDIT_ACTIONS.paymentRefunded]: "Pagamento reembolsado",
  [AUDIT_ACTIONS.quizUnpublished]: "Funil despublicado",
  [AUDIT_ACTIONS.quizDeleted]: "Funil excluído",
  [AUDIT_ACTIONS.settingsUpdated]: "Configurações atualizadas",
  [AUDIT_ACTIONS.maintenanceToggled]: "Manutenção alternada",
  [AUDIT_ACTIONS.subscriptionsExpired]: "Rotina de expiração executada",
  [AUDIT_ACTIONS.integrationCreated]: "Integração criada",
  [AUDIT_ACTIONS.integrationUpdated]: "Integração atualizada",
  [AUDIT_ACTIONS.integrationToggled]: "Integração ativada/desativada",
  [AUDIT_ACTIONS.integrationTokenRegenerated]: "URL da integração regenerada",
  [AUDIT_ACTIONS.integrationDeleted]: "Integração excluída",
  [AUDIT_ACTIONS.integrationEventReprocessed]: "Evento reprocessado",
};

export const INTEGRATION_KIND_LABELS: Record<string, string> = {
  purchase: "Compra",
  refund: "Reembolso",
};

export const INTEGRATION_EVENT_STATUS_LABELS: Record<string, string> = {
  captured: "Capturado",
  processed: "Processado",
  ignored: "Ignorado",
  failed: "Falhou",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  past_due: "Em atraso",
  canceled: "Cancelada",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
};

export const QUIZ_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export const WORKSPACE_ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
};
