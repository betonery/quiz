import type { PlatformRole } from "@/domains/admin/constants/admin.constants";
import type {
  PaymentStatus,
  PlanLimits,
  SubscriptionStatus,
} from "@/domains/billing/types/plan.types";
import type { QuizStatus } from "@/domains/quiz/types/quiz.types";

/** Quem está operando o painel. */
export type AdminActor = {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  /** `support` entra no painel, mas não escreve. */
  canWrite: boolean;
};

export type AdminActionResult<T = undefined> =
  | { success: true; data?: T }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export type AdminListParams = {
  search?: string;
  page: number;
  pageSize: number;
};

export type AdminListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

// --- Usuários --------------------------------------------------------------

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
  workspaceCount: number;
  quizCount: number;
};

export type AdminUserAuthInfo = {
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  bannedUntil: string | null;
  provider: string | null;
};

export type AdminUserWorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
  isOwner: boolean;
  planId: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  quizCount: number;
};

export type AdminUserDetail = {
  user: AdminUserRow;
  internalNotes: string | null;
  auth: AdminUserAuthInfo | null;
  workspaces: AdminUserWorkspaceSummary[];
  payments: AdminPaymentRow[];
};

// --- Workspaces ------------------------------------------------------------

export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  ownerId: string;
  ownerEmail: string | null;
  ownerName: string | null;
  memberCount: number;
  quizCount: number;
  publishedQuizCount: number;
  planId: string | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
};

export type AdminWorkspaceMember = {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  joinedAt: string;
};

export type AdminWorkspaceDetail = {
  workspace: AdminWorkspaceRow;
  members: AdminWorkspaceMember[];
  quizzes: AdminQuizRow[];
  payments: AdminPaymentRow[];
  customDomainCount: number;
};

// --- Planos ----------------------------------------------------------------

export type AdminPlanRow = {
  id: string;
  name: string;
  description: string | null;
  limits: PlanLimits;
  priceCents: number | null;
  checkoutUrl: string | null;
  /**
   * Identificadores do plano em plataformas externas de pagamento. Um evento
   * de compra chega com um desses códigos e é por ele que se descobre qual
   * plano liberar — por isso um código não pode se repetir entre planos.
   */
  externalReferences: string[];
  isActive: boolean;
  sortOrder: number;
  subscriberCount: number;
  activeSubscriberCount: number;
  createdAt: string;
};

// --- Assinaturas -----------------------------------------------------------

export type AdminSubscriptionRow = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  ownerEmail: string | null;
  planId: string;
  planName: string | null;
  priceCents: number | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  externalSubscriptionId: string | null;
  createdAt: string;
};

// --- Pagamentos ------------------------------------------------------------

export type AdminPaymentRow = {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  workspaceSlug: string | null;
  planId: string;
  planName: string | null;
  amountCents: number;
  paymentMethod: string;
  provider: string;
  externalPaymentId: string;
  status: PaymentStatus;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
};

// --- Funis -----------------------------------------------------------------

export type AdminQuizRow = {
  id: string;
  title: string;
  slug: string;
  status: QuizStatus;
  workspaceId: string;
  workspaceName: string | null;
  workspaceSlug: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  views: number;
  starts: number;
  completions: number;
};

// --- Auditoria -------------------------------------------------------------

export type AdminAuditLogRow = {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

// --- Visão geral -----------------------------------------------------------

export type AdminTrendPoint = {
  date: string;
  users: number;
  quizzes: number;
};

export type AdminOverviewMetrics = {
  users: {
    total: number;
    last7Days: number;
    last30Days: number;
    suspended: number;
    staff: number;
  };
  workspaces: {
    total: number;
    last30Days: number;
    withActiveSubscription: number;
  };
  quizzes: {
    total: number;
    published: number;
    draft: number;
    last30Days: number;
  };
  subscriptions: {
    active: number;
    pastDue: number;
    canceled: number;
    inactive: number;
    mrrCents: number;
  };
  revenue: {
    last30DaysCents: number;
    allTimeCents: number;
    refundedLast30DaysCents: number;
    paymentCount30Days: number;
  };
  traffic: {
    views30Days: number;
    starts30Days: number;
    completions30Days: number;
    conversionRate: number;
  };
  trend: AdminTrendPoint[];
  planDistribution: { planId: string; planName: string; count: number }[];
  recentUsers: AdminUserRow[];
  recentPayments: AdminPaymentRow[];
  recentAudit: AdminAuditLogRow[];
};

// --- Configurações ---------------------------------------------------------

export type AdminPlatformSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  signupsEnabled: boolean;
  signupsDisabledMessage: string;
  globalAnnouncement: string | null;
  defaultPlanId: string | null;
  trialDays: number;
  supportEmail: string | null;
  productName: string;
  productDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  landingHeadline: string;
  landingSubheadline: string;
  updatedAt: string;
  updatedBy: string | null;
};
