export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  dashboardPlan: "/dashboard/plan",
  dashboardProfile: "/dashboard/profile",
  invite: (token: string) => `/invite/${token}`,
  authCallback: "/auth/callback",
  workspace: (workspaceSlug: string) => `/${workspaceSlug}`,
  quizzes: (workspaceSlug: string) => `/${workspaceSlug}/quizzes`,
  quiz: (workspaceSlug: string, quizId: string) =>
    `/${workspaceSlug}/quizzes/${quizId}`,
  analytics: (workspaceSlug: string) => `/${workspaceSlug}/analytics`,
  integrations: (workspaceSlug: string) => `/${workspaceSlug}/integrations`,
  billing: (workspaceSlug: string) => `/${workspaceSlug}/billing`,
  settings: (workspaceSlug: string) => `/${workspaceSlug}/settings`,
  publicQuiz: (quizSlug: string) => `/q/${quizSlug}`,
  publicQuizPreview: (quizSlug: string) => `/q/${quizSlug}?preview=1`,
  share: (token: string) => `/share/${token}`,
  admin: {
    root: "/admin",
    users: "/admin/users",
    user: (userId: string) => `/admin/users/${userId}`,
    workspaces: "/admin/workspaces",
    workspace: (workspaceId: string) => `/admin/workspaces/${workspaceId}`,
    plans: "/admin/plans",
    subscriptions: "/admin/subscriptions",
    payments: "/admin/payments",
    quizzes: "/admin/quizzes",
    integrations: "/admin/integrations",
    integration: (integrationId: string) =>
      `/admin/integrations/${integrationId}`,
    audit: "/admin/audit",
    settings: "/admin/settings",
  },
  api: {
    health: "/api/health",
  },
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.home,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.authCallback,
] as const;

export const SESSION_REQUIRED_ROUTES = [ROUTES.resetPassword] as const;

export const PUBLIC_ROUTE_PREFIXES = ["/q/", "/api/health", "/share/"] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  ROUTES.dashboard,
  ROUTES.admin.root,
] as const;

export const AUTH_ROUTES = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
] as const;
