import "server-only";

import { PLATFORM_ROLES } from "@/domains/admin/constants/admin.constants";
import type {
  AdminListParams,
  AdminListResult,
  AdminPaymentRow,
  AdminUserAuthInfo,
  AdminUserDetail,
  AdminUserRow,
  AdminUserWorkspaceSummary,
} from "@/domains/admin/types/admin.types";
import { parsePlatformRole } from "@/domains/admin/utils/admin-access.utils";
import {
  buildOrIlikeFilter,
  clampPage,
  countBy,
  indexBy,
  pageCountFor,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";
import type { SubscriptionStatus } from "@/domains/billing/types/plan.types";
import { createAdminClient } from "@/services/supabase/admin";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  platform_role: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
};

function mapProfile(
  row: ProfileRow,
  counts: { workspaces: number; quizzes: number },
): AdminUserRow {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    platformRole: parsePlatformRole(row.platform_role),
    suspendedAt: row.suspended_at,
    suspendedReason: row.suspended_reason,
    createdAt: row.created_at,
    workspaceCount: counts.workspaces,
    quizCount: counts.quizzes,
  };
}

/** Contagens de workspaces/funis para um lote de usuários (evita N+1). */
async function loadUserCounts(userIds: string[]) {
  if (userIds.length === 0) {
    return {
      workspaces: new Map<string, number>(),
      quizzes: new Map<string, number>(),
    };
  }

  const admin = createAdminClient();
  const [membershipResult, quizResult] = await Promise.all([
    admin.from("workspace_members").select("user_id").in("user_id", userIds),
    admin.from("quizzes").select("created_by").in("created_by", userIds),
  ]);

  return {
    workspaces: countBy(membershipResult.data ?? [], (row) => row.user_id),
    quizzes: countBy(quizResult.data ?? [], (row) => row.created_by),
  };
}

export async function listUsers(
  params: AdminListParams & { role?: string; status?: "active" | "suspended" },
): Promise<AdminListResult<AdminUserRow>> {
  const admin = createAdminClient();

  const buildQuery = () => {
    let query = admin
      .from("profiles")
      .select(
        "id, email, full_name, avatar_url, platform_role, suspended_at, suspended_reason, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (params.search) {
      query = query.or(
        buildOrIlikeFilter(["email", "full_name"], params.search),
      );
    }
    if (params.role) {
      query = query.eq("platform_role", params.role);
    }
    if (params.status === "suspended") {
      query = query.not("suspended_at", "is", null);
    }
    if (params.status === "active") {
      query = query.is("suspended_at", null);
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

  const counts = await loadUserCounts(data.map((row) => row.id));

  return {
    items: data.map((row) =>
      mapProfile(row, {
        workspaces: counts.workspaces.get(row.id) ?? 0,
        quizzes: counts.quizzes.get(row.id) ?? 0,
      }),
    ),
    total,
    page,
    pageSize: params.pageSize,
    pageCount: pageCountFor(total, params.pageSize),
  };
}

export async function countPlatformAdmins(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("platform_role", PLATFORM_ROLES.ADMIN);

  return count ?? 0;
}

export async function getUserProfileRow(
  userId: string,
): Promise<(ProfileRow & { internal_notes: string | null }) | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, platform_role, suspended_at, suspended_reason, internal_notes, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function loadAuthInfo(userId: string): Promise<AdminUserAuthInfo | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) return null;

  const user = data.user as typeof data.user & { banned_until?: string | null };

  return {
    lastSignInAt: user.last_sign_in_at ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    bannedUntil: user.banned_until ?? null,
    provider: user.app_metadata?.provider ?? null,
  };
}

async function loadUserWorkspaces(
  userId: string,
): Promise<AdminUserWorkspaceSummary[]> {
  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) return [];

  const workspaceIds = memberships.map((row) => row.workspace_id);

  const [workspaceResult, subscriptionResult, quizResult, planResult] =
    await Promise.all([
      admin
        .from("workspaces")
        .select("id, name, slug, owner_id")
        .in("id", workspaceIds),
      admin
        .from("workspace_subscriptions")
        .select(
          "workspace_id, plan_id, status, current_period_start, current_period_end",
        )
        .in("workspace_id", workspaceIds),
      admin
        .from("quizzes")
        .select("workspace_id")
        .in("workspace_id", workspaceIds),
      admin.from("plans").select("id, name"),
    ]);

  const workspaceById = indexBy(workspaceResult.data ?? [], (row) => row.id);
  const subscriptionByWorkspace = indexBy(
    subscriptionResult.data ?? [],
    (row) => row.workspace_id,
  );
  const planNameById = indexBy(planResult.data ?? [], (row) => row.id);
  const quizCounts = countBy(quizResult.data ?? [], (row) => row.workspace_id);

  return memberships.flatMap((membership) => {
    const workspace = workspaceById.get(membership.workspace_id);
    if (!workspace) return [];

    const subscription = subscriptionByWorkspace.get(membership.workspace_id);

    return [
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: membership.role,
        isOwner: workspace.owner_id === userId,
        planId: subscription?.plan_id ?? null,
        planName: subscription
          ? (planNameById.get(subscription.plan_id)?.name ??
            subscription.plan_id)
          : null,
        subscriptionStatus: (subscription?.status ??
          null) as SubscriptionStatus | null,
        currentPeriodStart: subscription?.current_period_start ?? null,
        currentPeriodEnd: subscription?.current_period_end ?? null,
        quizCount: quizCounts.get(workspace.id) ?? 0,
      },
    ];
  });
}

async function loadUserPayments(
  workspaceIds: string[],
): Promise<AdminPaymentRow[]> {
  if (workspaceIds.length === 0) return [];

  const admin = createAdminClient();
  const [paymentResult, workspaceResult, planResult] = await Promise.all([
    admin
      .from("workspace_payments")
      .select("*")
      .in("workspace_id", workspaceIds)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("workspaces").select("id, name, slug").in("id", workspaceIds),
    admin.from("plans").select("id, name"),
  ]);

  const workspaceById = indexBy(workspaceResult.data ?? [], (row) => row.id);
  const planById = indexBy(planResult.data ?? [], (row) => row.id);

  return (paymentResult.data ?? []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: workspaceById.get(row.workspace_id)?.name ?? null,
    workspaceSlug: workspaceById.get(row.workspace_id)?.slug ?? null,
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
}

export async function getUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const profile = await getUserProfileRow(userId);
  if (!profile) return null;

  const [counts, auth, workspaces] = await Promise.all([
    loadUserCounts([userId]),
    loadAuthInfo(userId),
    loadUserWorkspaces(userId),
  ]);

  const payments = await loadUserPayments(
    workspaces.filter((workspace) => workspace.isOwner).map((w) => w.id),
  );

  return {
    user: mapProfile(profile, {
      workspaces: counts.workspaces.get(userId) ?? 0,
      quizzes: counts.quizzes.get(userId) ?? 0,
    }),
    internalNotes: profile.internal_notes,
    auth,
    workspaces,
    payments,
  };
}

export async function listRecentUsers(limit = 5): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, avatar_url, platform_role, suspended_at, suspended_reason, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const counts = await loadUserCounts(data.map((row) => row.id));

  return data.map((row) =>
    mapProfile(row, {
      workspaces: counts.workspaces.get(row.id) ?? 0,
      quizzes: counts.quizzes.get(row.id) ?? 0,
    }),
  );
}

// --- Escritas --------------------------------------------------------------

export type CreateUserResult =
  | { success: true; userId: string; workspaceId: string | null }
  | { success: false; error: string };

/**
 * Cria a conta já confirmada — quem cadastra pelo painel não passa pelo e-mail
 * de confirmação. O trigger `handle_new_user` cuida de profile, workspace e
 * membership na mesma transação, então basta buscar o workspace depois.
 */
export async function createUserAccount(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<CreateUserResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: params.email,
    password: params.password,
    email_confirm: true,
    user_metadata: { full_name: params.fullName },
  });

  if (error || !data.user) {
    const message = error?.message ?? "";
    if (/already|registered|exists/i.test(message)) {
      return { success: false, error: "Já existe uma conta com esse e-mail." };
    }
    return {
      success: false,
      error: message || "Não foi possível criar o usuário.",
    };
  }

  const workspaceId = await getPrimaryWorkspaceId(data.user.id);

  return { success: true, userId: data.user.id, workspaceId };
}

/** Workspace criado pelo trigger no cadastro — o mais antigo do usuário. */
export async function getPrimaryWorkspaceId(
  userId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function updatePlatformRole(
  userId: string,
  role: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ platform_role: role })
    .eq("id", userId);

  return !error;
}

/**
 * Suspender = banir no Auth (o que invalida a sessão) e espelhar em `profiles`
 * para a listagem conseguir filtrar sem chamar a Admin API por linha.
 */
export async function suspendUser(
  userId: string,
  reason: string,
): Promise<boolean> {
  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h", // ~100 anos: ban permanente até ser revertido
  });
  if (authError) return false;

  const { error } = await admin
    .from("profiles")
    .update({
      suspended_at: new Date().toISOString(),
      suspended_reason: reason,
    })
    .eq("id", userId);

  return !error;
}

export async function reinstateUser(userId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (authError) return false;

  const { error } = await admin
    .from("profiles")
    .update({ suspended_at: null, suspended_reason: null })
    .eq("id", userId);

  return !error;
}

export async function updateInternalNotes(
  userId: string,
  notes: string | null,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ internal_notes: notes })
    .eq("id", userId);

  return !error;
}

export async function confirmUserEmail(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  return !error;
}

/** Gera o link de recuperação para enviar manualmente ao usuário. */
export async function generatePasswordResetLink(
  email: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${appUrl}/auth/callback` },
  });

  if (error || !data.properties?.action_link) return null;
  return data.properties.action_link;
}

/** Remove de auth.users; o cascade em profiles leva workspaces e funis junto. */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  return !error;
}
