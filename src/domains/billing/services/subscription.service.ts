import { getPlanById } from "@/domains/billing/services/plan.service";
import type {
  PlanLimits,
  SubscriptionStatus,
  WorkspaceSubscription,
  WorkspaceSubscriptionWithPlan,
} from "@/domains/billing/types/plan.types";
import {
  evaluateCreateQuizAccess,
  evaluateCustomDomainAccess,
  evaluateInviteMemberAccess,
  isSubscriptionActive,
} from "@/domains/billing/utils/plan-limits.utils";
import { createClient } from "@/services/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";

export {
  isSubscriptionActive,
  shouldBlockPublicQuizAccess,
} from "@/domains/billing/utils/plan-limits.utils";

function mapSubscription(row: {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  external_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}): WorkspaceSubscription {
  return {
    ...row,
    status: row.status as SubscriptionStatus,
  };
}

export async function isWorkspaceSubscriptionActive(
  workspaceId: string,
): Promise<boolean> {
  const subscription = await getWorkspaceSubscription(workspaceId);
  return isSubscriptionActive(subscription);
}

export async function isWorkspaceSubscriptionActiveForPublicAccess(
  workspaceId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspace_subscriptions")
    // `current_period_end` entra porque a checagem de acesso considera o prazo,
    // não só o status.
    .select("status, current_period_end")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return isSubscriptionActive(data);
}

export async function getWorkspaceSubscription(
  workspaceId: string,
): Promise<WorkspaceSubscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapSubscription(data);
}

export async function getWorkspaceSubscriptionWithPlan(
  workspaceId: string,
): Promise<WorkspaceSubscriptionWithPlan | null> {
  const subscription = await getWorkspaceSubscription(workspaceId);
  if (!subscription) {
    return null;
  }

  const plan = await getPlanById(subscription.plan_id);
  if (!plan) {
    return null;
  }

  return { ...subscription, plan };
}

export async function countQuizzesInWorkspace(
  workspaceId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function countTeamMembersInWorkspace(
  workspaceId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function countCustomDomainsInWorkspace(
  workspaceId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("quiz_custom_domains")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .neq("status", "removed");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function getActivePlanLimits(
  workspaceId: string,
): Promise<{ limits: PlanLimits; hasActiveSubscription: boolean } | null> {
  const subscriptionWithPlan =
    await getWorkspaceSubscriptionWithPlan(workspaceId);
  if (!subscriptionWithPlan) {
    return null;
  }

  return {
    limits: subscriptionWithPlan.plan.limits,
    hasActiveSubscription: subscriptionWithPlan.status === "active",
  };
}

export async function getCreateQuizAccess(workspaceId: string) {
  const context = await getActivePlanLimits(workspaceId);
  const quizCount = await countQuizzesInWorkspace(workspaceId);

  if (!context) {
    return evaluateCreateQuizAccess({
      hasActiveSubscription: false,
      limits: { max_quizzes: 0, max_team_members: 0, max_custom_domains: 0 },
      quizCount,
    });
  }

  return evaluateCreateQuizAccess({
    hasActiveSubscription: context.hasActiveSubscription,
    limits: context.limits,
    quizCount,
  });
}

export async function assertCanCreateQuiz(workspaceId: string): Promise<void> {
  const access = await getCreateQuizAccess(workspaceId);
  if (!access.allowed) {
    throw new Error(access.message);
  }
}

export async function assertCanInviteMember(
  workspaceId: string,
): Promise<void> {
  const context = await getActivePlanLimits(workspaceId);
  const memberCount = await countTeamMembersInWorkspace(workspaceId);

  const access = evaluateInviteMemberAccess({
    hasActiveSubscription: context?.hasActiveSubscription ?? false,
    limits: context?.limits ?? {
      max_quizzes: 0,
      max_team_members: 0,
      max_custom_domains: 0,
    },
    memberCount,
  });

  if (!access.allowed) {
    throw new Error(access.message);
  }
}

export async function assertCanAddCustomDomain(
  workspaceId: string,
): Promise<void> {
  const context = await getActivePlanLimits(workspaceId);
  const customDomainCount = await countCustomDomainsInWorkspace(workspaceId);

  const access = evaluateCustomDomainAccess({
    hasActiveSubscription: context?.hasActiveSubscription ?? false,
    limits: context?.limits ?? {
      max_quizzes: 0,
      max_team_members: 0,
      max_custom_domains: 0,
    },
    customDomainCount,
  });

  if (!access.allowed) {
    throw new Error(access.message);
  }
}

function buildSubscriptionUpsertRow(params: {
  workspaceId: string;
  planId: string;
  status?: SubscriptionStatus;
  periodStart?: string;
  periodEnd?: string;
  externalSubscriptionId?: string | null;
}) {
  const now = new Date().toISOString();
  const defaultPeriodEnd = new Date();
  defaultPeriodEnd.setMonth(defaultPeriodEnd.getMonth() + 1);

  return {
    workspace_id: params.workspaceId,
    plan_id: params.planId,
    status: params.status ?? "active",
    current_period_start: params.periodStart ?? now,
    current_period_end: params.periodEnd ?? defaultPeriodEnd.toISOString(),
    ...(params.externalSubscriptionId != null
      ? { external_subscription_id: params.externalSubscriptionId }
      : {}),
  };
}

export async function upsertWorkspaceSubscription(params: {
  workspaceId: string;
  planId: string;
  status?: SubscriptionStatus;
  periodStart?: string;
  periodEnd?: string;
  externalSubscriptionId?: string | null;
}): Promise<WorkspaceSubscription> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_subscriptions")
    .upsert(buildSubscriptionUpsertRow(params), { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Não foi possível ativar a assinatura");
  }

  return mapSubscription(data);
}
