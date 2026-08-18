import "server-only";

import { listRecentAudit } from "@/domains/admin/services/admin-audit.service";
import {
  listAllPaymentsForMetrics,
  listRecentPayments,
} from "@/domains/admin/services/admin-payments.service";
import { getPlanPriceMap } from "@/domains/admin/services/admin-plans.service";
import {
  listQuizzesForMetrics,
  sumTrafficSince,
} from "@/domains/admin/services/admin-quizzes.service";
import { listRecentUsers } from "@/domains/admin/services/admin-users.service";
import type { AdminOverviewMetrics } from "@/domains/admin/types/admin.types";
import {
  buildTrend,
  calculateMrrCents,
  countByStatus,
  countSince,
  dayKey,
  daysAgo,
  sumPaymentsCents,
} from "@/domains/admin/utils/admin-metrics.utils";
import { safeRate } from "@/domains/admin/utils/admin-format.utils";
import { createAdminClient } from "@/services/supabase/admin";

const TREND_DAYS = 30;

/**
 * Agrega tudo que a visão geral mostra.
 *
 * Puxa as colunas cruas e agrega em memória: são poucas linhas nesta fase do
 * produto e evita criar uma RPC por métrica. Se a base crescer, o caminho é
 * trocar estas queries por uma view materializada.
 */
export async function getOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const admin = createAdminClient();
  const now = new Date();
  const since7 = daysAgo(7, now);
  const since30 = daysAgo(30, now);

  const [
    profilesResult,
    workspacesResult,
    subscriptionsResult,
    quizRows,
    payments,
    planPrices,
    traffic,
    recentUsers,
    recentPayments,
    recentAudit,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("created_at, platform_role, suspended_at")
      .order("created_at", { ascending: false })
      .limit(20000),
    admin
      .from("workspaces")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(20000),
    admin
      .from("workspace_subscriptions")
      .select("workspace_id, plan_id, status"),
    listQuizzesForMetrics(),
    listAllPaymentsForMetrics(),
    getPlanPriceMap(),
    sumTrafficSince(dayKey(since30)),
    listRecentUsers(5),
    listRecentPayments(5),
    listRecentAudit(6),
  ]);

  const profiles = profilesResult.data ?? [];
  const workspaces = workspacesResult.data ?? [];
  const subscriptions = subscriptionsResult.data ?? [];

  const subscriptionCounts = countByStatus(subscriptions);
  const activeWorkspaceIds = new Set(
    subscriptions
      .filter((row) => row.status === "active")
      .map((row) => row.workspace_id),
  );

  const planNameById = new Map<string, string>();
  const { data: planRows } = await admin.from("plans").select("id, name");
  for (const plan of planRows ?? []) planNameById.set(plan.id, plan.name);

  const planCounts = new Map<string, number>();
  for (const subscription of subscriptions) {
    if (subscription.status !== "active") continue;
    planCounts.set(
      subscription.plan_id,
      (planCounts.get(subscription.plan_id) ?? 0) + 1,
    );
  }

  const publishedQuizzes = quizRows.filter(
    (row) => row.status === "published",
  ).length;
  const draftQuizzes = quizRows.filter((row) => row.status === "draft").length;

  return {
    users: {
      total: profiles.length,
      last7Days: countSince(profiles, since7),
      last30Days: countSince(profiles, since30),
      suspended: profiles.filter((row) => row.suspended_at !== null).length,
      staff: profiles.filter((row) => row.platform_role !== "user").length,
    },
    workspaces: {
      total: workspaces.length,
      last30Days: countSince(workspaces, since30),
      withActiveSubscription: activeWorkspaceIds.size,
    },
    quizzes: {
      total: quizRows.length,
      published: publishedQuizzes,
      draft: draftQuizzes,
      last30Days: countSince(quizRows, since30),
    },
    subscriptions: {
      active: subscriptionCounts.active ?? 0,
      pastDue: subscriptionCounts.past_due ?? 0,
      canceled: subscriptionCounts.canceled ?? 0,
      inactive: subscriptionCounts.inactive ?? 0,
      mrrCents: calculateMrrCents(subscriptions, planPrices),
    },
    revenue: {
      last30DaysCents: sumPaymentsCents(payments, {
        status: "paid",
        since: since30,
      }),
      allTimeCents: sumPaymentsCents(payments, { status: "paid" }),
      refundedLast30DaysCents: sumPaymentsCents(payments, {
        status: "refunded",
        since: since30,
      }),
      paymentCount30Days: payments.filter(
        (payment) =>
          payment.status === "paid" &&
          new Date(payment.created_at).getTime() >= since30.getTime(),
      ).length,
    },
    traffic: {
      views30Days: traffic.views,
      starts30Days: traffic.starts,
      completions30Days: traffic.completions,
      conversionRate: safeRate(traffic.completions, traffic.starts),
    },
    trend: buildTrend({
      users: profiles,
      quizzes: quizRows,
      days: TREND_DAYS,
      now,
    }),
    planDistribution: [...planCounts.entries()]
      .map(([planId, count]) => ({
        planId,
        planName: planNameById.get(planId) ?? planId,
        count,
      }))
      .sort((a, b) => b.count - a.count),
    recentUsers,
    recentPayments,
    recentAudit,
  };
}
