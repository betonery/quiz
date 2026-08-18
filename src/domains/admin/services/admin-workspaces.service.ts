import "server-only";

import type {
  AdminListParams,
  AdminListResult,
  AdminPaymentRow,
  AdminQuizRow,
  AdminWorkspaceDetail,
  AdminWorkspaceMember,
  AdminWorkspaceRow,
} from "@/domains/admin/types/admin.types";
import {
  buildOrIlikeFilter,
  clampPage,
  countBy,
  indexBy,
  pageCountFor,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";
import type { SubscriptionStatus } from "@/domains/billing/types/plan.types";
import type { QuizStatus } from "@/domains/quiz/types/quiz.types";
import { createAdminClient } from "@/services/supabase/admin";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
};

/** Enriquece um lote de workspaces com owner, plano e contagens (evita N+1). */
async function decorateWorkspaces(
  rows: WorkspaceRow[],
): Promise<AdminWorkspaceRow[]> {
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const workspaceIds = rows.map((row) => row.id);
  const ownerIds = [...new Set(rows.map((row) => row.owner_id))];

  const [
    ownerResult,
    memberResult,
    quizResult,
    subscriptionResult,
    planResult,
  ] = await Promise.all([
    admin.from("profiles").select("id, email, full_name").in("id", ownerIds),
    admin
      .from("workspace_members")
      .select("workspace_id")
      .in("workspace_id", workspaceIds),
    admin
      .from("quizzes")
      .select("workspace_id, status")
      .in("workspace_id", workspaceIds),
    admin
      .from("workspace_subscriptions")
      .select("workspace_id, plan_id, status, current_period_end")
      .in("workspace_id", workspaceIds),
    admin.from("plans").select("id, name"),
  ]);

  const ownerById = indexBy(ownerResult.data ?? [], (row) => row.id);
  const memberCounts = countBy(memberResult.data ?? [], (r) => r.workspace_id);
  const quizCounts = countBy(quizResult.data ?? [], (r) => r.workspace_id);
  const publishedCounts = countBy(
    (quizResult.data ?? []).filter((row) => row.status === "published"),
    (row) => row.workspace_id,
  );
  const subscriptionByWorkspace = indexBy(
    subscriptionResult.data ?? [],
    (row) => row.workspace_id,
  );
  const planById = indexBy(planResult.data ?? [], (row) => row.id);

  return rows.map((row) => {
    const owner = ownerById.get(row.owner_id);
    const subscription = subscriptionByWorkspace.get(row.id);

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
      ownerId: row.owner_id,
      ownerEmail: owner?.email ?? null,
      ownerName: owner?.full_name ?? null,
      memberCount: memberCounts.get(row.id) ?? 0,
      quizCount: quizCounts.get(row.id) ?? 0,
      publishedQuizCount: publishedCounts.get(row.id) ?? 0,
      planId: subscription?.plan_id ?? null,
      planName: subscription
        ? (planById.get(subscription.plan_id)?.name ?? subscription.plan_id)
        : null,
      subscriptionStatus: (subscription?.status ??
        null) as SubscriptionStatus | null,
      currentPeriodEnd: subscription?.current_period_end ?? null,
    };
  });
}

export async function listWorkspaces(
  params: AdminListParams & { status?: string },
): Promise<AdminListResult<AdminWorkspaceRow>> {
  const admin = createAdminClient();

  // A assinatura vive em outra tabela: os ids precisam ser resolvidos antes da
  // paginação, senão a página vem incompleta e o total, errado.
  let statusFilter: { include: string[] } | { exclude: string[] } | null = null;

  if (params.status === "none") {
    const { data } = await admin
      .from("workspace_subscriptions")
      .select("workspace_id");
    statusFilter = { exclude: (data ?? []).map((row) => row.workspace_id) };
  } else if (params.status) {
    const { data } = await admin
      .from("workspace_subscriptions")
      .select("workspace_id")
      .eq("status", params.status);

    const include = (data ?? []).map((row) => row.workspace_id);
    if (include.length === 0) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: params.pageSize,
        pageCount: 1,
      };
    }
    statusFilter = { include };
  }

  const buildQuery = () => {
    let query = admin
      .from("workspaces")
      .select("id, name, slug, owner_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.search) {
      query = query.or(buildOrIlikeFilter(["name", "slug"], params.search));
    }

    if (statusFilter && "include" in statusFilter) {
      query = query.in("id", statusFilter.include);
    } else if (statusFilter && statusFilter.exclude.length > 0) {
      query = query.not("id", "in", `(${statusFilter.exclude.join(",")})`);
    }

    return query;
  };

  const { count } = await buildQuery().range(0, 0);
  const total = count ?? 0;
  const page = clampPage(params.page, total, params.pageSize);
  const { from, to } = toRange(page, params.pageSize);

  const { data, error } = await buildQuery().range(from, to);

  if (error || !data) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params.pageSize,
      pageCount: 1,
    };
  }

  return {
    items: await decorateWorkspaces(data),
    total,
    page,
    pageSize: params.pageSize,
    pageCount: pageCountFor(total, params.pageSize),
  };
}

export async function getWorkspaceDetail(
  workspaceId: string,
): Promise<AdminWorkspaceDetail | null> {
  const admin = createAdminClient();

  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, name, slug, owner_id, created_at")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) return null;

  const [decorated] = await decorateWorkspaces([workspace]);

  const [memberResult, quizResult, paymentResult, domainResult, planResult] =
    await Promise.all([
      admin
        .from("workspace_members")
        .select("user_id, role, created_at")
        .eq("workspace_id", workspaceId),
      admin
        .from("quizzes")
        .select("id, title, slug, status, created_at, updated_at, published_at")
        .eq("workspace_id", workspaceId)
        .order("updated_at", { ascending: false })
        .limit(50),
      admin
        .from("workspace_payments")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("quiz_custom_domains")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .neq("status", "removed"),
      admin.from("plans").select("id, name"),
    ]);

  const memberIds = (memberResult.data ?? []).map((row) => row.user_id);
  const { data: profiles } = memberIds.length
    ? await admin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", memberIds)
    : { data: [] };

  const profileById = indexBy(profiles ?? [], (row) => row.id);
  const planById = indexBy(planResult.data ?? [], (row) => row.id);

  const members: AdminWorkspaceMember[] = (memberResult.data ?? []).map(
    (row) => ({
      userId: row.user_id,
      email: profileById.get(row.user_id)?.email ?? "—",
      fullName: profileById.get(row.user_id)?.full_name ?? null,
      role: row.role,
      joinedAt: row.created_at,
    }),
  );

  const quizzes: AdminQuizRow[] = (quizResult.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status as QuizStatus,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    views: 0,
    starts: 0,
    completions: 0,
  }));

  const payments: AdminPaymentRow[] = (paymentResult.data ?? []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: workspace.name,
    workspaceSlug: workspace.slug,
    planId: row.plan_id,
    planName: planById.get(row.plan_id)?.name ?? row.plan_id,
    amountCents: row.amount_cents,
    paymentMethod: row.payment_method,
    provider: row.provider,
    externalPaymentId: row.external_payment_id,
    status: row.status as AdminPaymentRow["status"],
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
  }));

  return {
    workspace: decorated,
    members,
    quizzes,
    payments,
    customDomainCount: domainResult.count ?? 0,
  };
}

export async function listAllWorkspacesForSelect(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspaces")
    .select("id, name, slug")
    .order("name", { ascending: true })
    .limit(500);

  return data ?? [];
}

// --- Escritas --------------------------------------------------------------

export async function renameWorkspace(
  workspaceId: string,
  name: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId);

  return !error;
}

export async function deleteWorkspace(workspaceId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  return !error;
}

/**
 * Transfere a propriedade. O novo dono precisa já ser membro; a role dele vira
 * `owner` e a do antigo cai para `admin`, mantendo o acesso dele ao workspace.
 */
export async function transferWorkspaceOwnership(
  workspaceId: string,
  newOwnerId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", newOwnerId)
    .maybeSingle();

  if (!membership) {
    return {
      success: false,
      error: "O novo proprietário precisa ser membro do workspace.",
    };
  }

  const { data: workspace } = await admin
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) {
    return { success: false, error: "Workspace não encontrado." };
  }

  const { error } = await admin
    .from("workspaces")
    .update({ owner_id: newOwnerId })
    .eq("id", workspaceId);

  if (error) {
    return {
      success: false,
      error: "Não foi possível transferir a propriedade.",
    };
  }

  await admin
    .from("workspace_members")
    .update({ role: "owner" })
    .eq("workspace_id", workspaceId)
    .eq("user_id", newOwnerId);

  if (workspace.owner_id !== newOwnerId) {
    await admin
      .from("workspace_members")
      .update({ role: "admin" })
      .eq("workspace_id", workspaceId)
      .eq("user_id", workspace.owner_id);
  }

  return { success: true };
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  return !error;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: workspace } = await admin
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspace?.owner_id === userId) {
    return {
      success: false,
      error: "Transfira a propriedade antes de remover o dono do workspace.",
    };
  }

  const { error } = await admin
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  return error
    ? { success: false, error: "Falha ao remover membro." }
    : { success: true };
}
