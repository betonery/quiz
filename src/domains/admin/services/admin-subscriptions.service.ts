import "server-only";

import type {
  AdminListParams,
  AdminListResult,
  AdminSubscriptionRow,
} from "@/domains/admin/types/admin.types";
import {
  buildOrIlikeFilter,
  clampPage,
  indexBy,
  pageCountFor,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";
import type { SubscriptionStatus } from "@/domains/billing/types/plan.types";
import { createAdminClient } from "@/services/supabase/admin";

type SubscriptionRow = {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  external_subscription_id: string | null;
  created_at: string;
};

async function decorateSubscriptions(
  rows: SubscriptionRow[],
): Promise<AdminSubscriptionRow[]> {
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const workspaceIds = rows.map((row) => row.workspace_id);

  const [workspaceResult, planResult] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, name, slug, owner_id")
      .in("id", workspaceIds),
    admin.from("plans").select("id, name, price_cents"),
  ]);

  const ownerIds = [
    ...new Set((workspaceResult.data ?? []).map((row) => row.owner_id)),
  ];
  const { data: owners } = ownerIds.length
    ? await admin.from("profiles").select("id, email").in("id", ownerIds)
    : { data: [] };

  const workspaceById = indexBy(workspaceResult.data ?? [], (row) => row.id);
  const planById = indexBy(planResult.data ?? [], (row) => row.id);
  const ownerById = indexBy(owners ?? [], (row) => row.id);

  return rows.map((row) => {
    const workspace = workspaceById.get(row.workspace_id);
    const plan = planById.get(row.plan_id);

    return {
      id: row.id,
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name ?? "—",
      workspaceSlug: workspace?.slug ?? "",
      ownerEmail: workspace
        ? (ownerById.get(workspace.owner_id)?.email ?? null)
        : null,
      planId: row.plan_id,
      planName: plan?.name ?? row.plan_id,
      priceCents: plan?.price_cents ?? null,
      status: row.status as SubscriptionStatus,
      currentPeriodStart: row.current_period_start,
      currentPeriodEnd: row.current_period_end,
      externalSubscriptionId: row.external_subscription_id,
      createdAt: row.created_at,
    };
  });
}

/**
 * Resolve os workspaces que batem com o termo — por nome/slug do workspace ou
 * pelo e-mail do dono. Precisa acontecer ANTES da paginação: filtrar depois
 * devolveria páginas incompletas e um total errado.
 */
async function resolveWorkspaceIdsForSearch(search: string): Promise<string[]> {
  const admin = createAdminClient();

  const [byWorkspace, byOwner] = await Promise.all([
    admin
      .from("workspaces")
      .select("id")
      .or(buildOrIlikeFilter(["name", "slug"], search))
      .limit(1000),
    admin
      .from("profiles")
      .select("id")
      .ilike("email", `%${search}%`)
      .limit(1000),
  ]);

  const ids = new Set((byWorkspace.data ?? []).map((row) => row.id));

  const ownerIds = (byOwner.data ?? []).map((row) => row.id);
  if (ownerIds.length > 0) {
    const { data } = await admin
      .from("workspaces")
      .select("id")
      .in("owner_id", ownerIds)
      .limit(1000);

    for (const row of data ?? []) ids.add(row.id);
  }

  return [...ids];
}

export async function listSubscriptions(
  params: AdminListParams & { status?: string; planId?: string },
): Promise<AdminListResult<AdminSubscriptionRow>> {
  const admin = createAdminClient();

  const searchIds = params.search
    ? await resolveWorkspaceIdsForSearch(params.search)
    : null;

  // Busca sem nenhum workspace correspondente: nada a paginar.
  if (searchIds !== null && searchIds.length === 0) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params.pageSize,
      pageCount: 1,
    };
  }

  const buildQuery = () => {
    let query = admin
      .from("workspace_subscriptions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.status) query = query.eq("status", params.status);
    if (params.planId) query = query.eq("plan_id", params.planId);
    if (searchIds !== null) query = query.in("workspace_id", searchIds);

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
    items: await decorateSubscriptions(data),
    total,
    page,
    pageSize: params.pageSize,
    pageCount: pageCountFor(total, params.pageSize),
  };
}

export async function getSubscriptionForWorkspace(
  workspaceId: string,
): Promise<AdminSubscriptionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!data) return null;
  const [decorated] = await decorateSubscriptions([data]);
  return decorated ?? null;
}

export type SubscriptionWriteInput = {
  workspaceId: string;
  planId: string;
  status: SubscriptionStatus;
  periodStart: string;
  periodEnd: string;
};

export async function upsertSubscription(
  input: SubscriptionWriteInput,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("workspace_subscriptions").upsert(
    {
      workspace_id: input.workspaceId,
      plan_id: input.planId,
      status: input.status,
      current_period_start: input.periodStart,
      current_period_end: input.periodEnd,
    },
    { onConflict: "workspace_id" },
  );

  return !error;
}

export async function cancelSubscription(
  workspaceId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("workspace_subscriptions")
    .update({ status: "canceled" })
    .eq("workspace_id", workspaceId);

  return !error;
}

/** Empurra o fim do período em N dias e reativa a assinatura. */
export async function extendSubscription(
  workspaceId: string,
  days: number,
): Promise<{ success: boolean; newPeriodEnd?: string; error?: string }> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("workspace_subscriptions")
    .select("current_period_end")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!data) {
    return { success: false, error: "Workspace não possui assinatura." };
  }

  // Período vencido reinicia a partir de hoje, não da data passada.
  const now = new Date();
  const currentEnd = data.current_period_end
    ? new Date(data.current_period_end)
    : now;
  const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;

  const newEnd = new Date(base.getTime());
  newEnd.setDate(newEnd.getDate() + days);
  const newPeriodEnd = newEnd.toISOString();

  const { error } = await admin
    .from("workspace_subscriptions")
    .update({ current_period_end: newPeriodEnd, status: "active" })
    .eq("workspace_id", workspaceId);

  if (error) {
    return { success: false, error: "Não foi possível estender a assinatura." };
  }

  return { success: true, newPeriodEnd };
}

/** Dispara a rotina que marca assinaturas vencidas como `past_due`. */
export async function runExpireOverdueSubscriptions(): Promise<{
  success: boolean;
  result?: unknown;
}> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("expire_overdue_subscriptions");

  if (error) return { success: false };
  return { success: true, result: data };
}
