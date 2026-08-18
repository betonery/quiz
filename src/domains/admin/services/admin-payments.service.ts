import "server-only";

import type {
  AdminListParams,
  AdminListResult,
  AdminPaymentRow,
} from "@/domains/admin/types/admin.types";
import {
  clampPage,
  indexBy,
  pageCountFor,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";
import { createAdminClient } from "@/services/supabase/admin";
import type { Json } from "@/types/database.types";

type PaymentRow = {
  id: string;
  workspace_id: string;
  plan_id: string;
  external_payment_id: string;
  provider: string;
  amount_cents: number;
  payment_method: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
};

async function decoratePayments(
  rows: PaymentRow[],
): Promise<AdminPaymentRow[]> {
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const workspaceIds = [...new Set(rows.map((row) => row.workspace_id))];

  const [workspaceResult, planResult] = await Promise.all([
    admin.from("workspaces").select("id, name, slug").in("id", workspaceIds),
    admin.from("plans").select("id, name"),
  ]);

  const workspaceById = indexBy(workspaceResult.data ?? [], (row) => row.id);
  const planById = indexBy(planResult.data ?? [], (row) => row.id);

  return rows.map((row) => ({
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

export async function listPayments(
  params: AdminListParams & { status?: string; provider?: string },
): Promise<AdminListResult<AdminPaymentRow> & { totalCents: number }> {
  const admin = createAdminClient();

  const buildQuery = () => {
    let query = admin
      .from("workspace_payments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.status) query = query.eq("status", params.status);
    if (params.provider) query = query.eq("provider", params.provider);
    if (params.search) {
      query = query.ilike("external_payment_id", `%${params.search}%`);
    }

    return query;
  };

  const { count } = await buildQuery().range(0, 0);
  const total = count ?? 0;
  const page = clampPage(params.page, total, params.pageSize);
  const { from, to } = toRange(page, params.pageSize);

  const [{ data, error }, sumResult] = await Promise.all([
    buildQuery().range(from, to),
    admin
      .from("workspace_payments")
      .select("amount_cents")
      .eq("status", "paid"),
  ]);

  const totalCents = (sumResult.data ?? []).reduce(
    (acc, row) => acc + row.amount_cents,
    0,
  );

  if (error || !data) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params.pageSize,
      pageCount: 1,
      totalCents,
    };
  }

  return {
    items: await decoratePayments(data),
    total,
    page,
    pageSize: params.pageSize,
    pageCount: pageCountFor(total, params.pageSize),
    totalCents,
  };
}

export async function listRecentPayments(
  limit = 5,
): Promise<AdminPaymentRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return decoratePayments(data ?? []);
}

export async function listAllPaymentsForMetrics(): Promise<
  { amount_cents: number; status: string; created_at: string }[]
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_payments")
    .select("amount_cents, status, created_at");

  return data ?? [];
}

export type ManualPaymentInput = {
  workspaceId: string;
  planId: string;
  amountCents: number;
  paymentMethod: string;
  periodStart: string;
  periodEnd: string;
  externalPaymentId: string;
  actorEmail: string;
};

/**
 * Lançamento manual (PIX na mão, cortesia, acerto administrativo).
 * Fica com `provider = 'manual'` para separar do que veio de webhook.
 */
export async function recordManualPayment(
  input: ManualPaymentInput,
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("workspace_payments")
    .insert({
      workspace_id: input.workspaceId,
      plan_id: input.planId,
      external_payment_id: input.externalPaymentId,
      provider: "manual",
      amount_cents: input.amountCents,
      payment_method: input.paymentMethod,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      status: "paid",
      raw_payload: {
        source: "admin_panel",
        recorded_by: input.actorEmail,
      } as unknown as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "Já existe um pagamento com esse ID externo.",
      };
    }
    return { success: false, error: "Não foi possível registrar o pagamento." };
  }

  return { success: true, paymentId: data.id };
}

export async function getPaymentRow(paymentId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  return data;
}

/**
 * Reembolso via RPC existente — ela marca o original como `refunded`, cria a
 * contrapartida negativa e ajusta a assinatura numa única transação.
 */
export async function refundPayment(
  paymentId: string,
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error } = await admin.rpc("process_payment_refund", {
    payload: {
      event: "payment.refunded",
      workspace_id: workspaceId,
      payment_id: paymentId,
    } as unknown as Json,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function listPaymentProviders(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("workspace_payments")
    .select("provider")
    .limit(1000);

  return [...new Set((data ?? []).map((row) => row.provider))];
}
