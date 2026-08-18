import "server-only";

import type { AdminPlanRow } from "@/domains/admin/types/admin.types";
import { countBy } from "@/domains/admin/utils/admin-query.utils";
import { planLimitsSchema } from "@/domains/billing/schemas/plan-limits.schema";
import type { PlanLimits } from "@/domains/billing/types/plan.types";
import { createAdminClient } from "@/services/supabase/admin";
import type { Json } from "@/types/database.types";

const FALLBACK_LIMITS: PlanLimits = {
  max_quizzes: 0,
  max_team_members: 0,
  max_custom_domains: 0,
};

function parseLimits(raw: unknown): PlanLimits {
  const parsed = planLimitsSchema.safeParse(raw);
  return parsed.success ? parsed.data : FALLBACK_LIMITS;
}

/** Inclui planos arquivados — o painel precisa enxergar tudo. */
export async function listAllPlans(): Promise<AdminPlanRow[]> {
  const admin = createAdminClient();

  const [planResult, subscriptionResult] = await Promise.all([
    admin.from("plans").select("*").order("sort_order", { ascending: true }),
    admin.from("workspace_subscriptions").select("plan_id, status"),
  ]);

  if (planResult.error || !planResult.data) return [];

  const subscribers = countBy(subscriptionResult.data ?? [], (r) => r.plan_id);
  const activeSubscribers = countBy(
    (subscriptionResult.data ?? []).filter((row) => row.status === "active"),
    (row) => row.plan_id,
  );

  return planResult.data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    limits: parseLimits(row.limits),
    priceCents: row.price_cents,
    checkoutUrl: row.checkout_url,
    externalReferences: row.external_references ?? [],
    isActive: row.is_active,
    sortOrder: row.sort_order,
    subscriberCount: subscribers.get(row.id) ?? 0,
    activeSubscriberCount: activeSubscribers.get(row.id) ?? 0,
    createdAt: row.created_at,
  }));
}

export async function getPlanRow(planId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  return data;
}

export async function planIdExists(planId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("plans")
    .select("id", { count: "exact", head: true })
    .eq("id", planId);

  return (count ?? 0) > 0;
}

export type PlanWriteInput = {
  id: string;
  name: string;
  description: string | null;
  limits: PlanLimits;
  priceCents: number | null;
  checkoutUrl: string | null;
  externalReferences: string[];
  isActive: boolean;
  sortOrder: number;
};

export async function createPlan(input: PlanWriteInput): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("plans").insert({
    id: input.id,
    name: input.name,
    description: input.description,
    limits: input.limits as unknown as Json,
    price_cents: input.priceCents,
    checkout_url: input.checkoutUrl,
    external_references: input.externalReferences,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  });

  return !error;
}

// `stripe_price_id` não entra no update: a coluna segue no banco por causa do
// histórico, mas saiu do formulário e não deve ser sobrescrita.
export async function updatePlan(
  planId: string,
  input: Omit<PlanWriteInput, "id">,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("plans")
    .update({
      name: input.name,
      description: input.description,
      limits: input.limits as unknown as Json,
      price_cents: input.priceCents,
      checkout_url: input.checkoutUrl,
      external_references: input.externalReferences,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq("id", planId);

  return !error;
}

/**
 * Busca códigos já usados por OUTROS planos. O evento de compra só carrega o
 * código: se dois planos compartilhassem o mesmo, não haveria como decidir
 * qual liberar.
 */
export async function findConflictingExternalReferences(
  references: string[],
  excludePlanId?: string,
): Promise<{ reference: string; planId: string; planName: string }[]> {
  if (references.length === 0) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("plans")
    .select("id, name, external_references")
    .overlaps("external_references", references);

  const conflicts: { reference: string; planId: string; planName: string }[] =
    [];

  for (const plan of data ?? []) {
    if (plan.id === excludePlanId) continue;
    for (const reference of plan.external_references ?? []) {
      if (references.includes(reference)) {
        conflicts.push({
          reference,
          planId: plan.id,
          planName: plan.name,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Planos nunca são excluídos: `workspace_subscriptions.plan_id` e
 * `workspace_payments.plan_id` referenciam a linha, e o histórico de cobrança
 * precisa continuar legível. Arquivar tira o plano da vitrine e mantém o resto.
 */
export async function setPlanActive(
  planId: string,
  isActive: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("plans")
    .update({ is_active: isActive })
    .eq("id", planId);

  return !error;
}

export async function countActiveSubscribersForPlan(
  planId: string,
): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("workspace_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", planId)
    .eq("status", "active");

  return count ?? 0;
}

export async function getPlanPriceMap(): Promise<Map<string, number | null>> {
  const admin = createAdminClient();
  const { data } = await admin.from("plans").select("id, price_cents");
  return new Map((data ?? []).map((row) => [row.id, row.price_cents]));
}

export async function getPlanNameMap(): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const { data } = await admin.from("plans").select("id, name");
  return new Map((data ?? []).map((row) => [row.id, row.name]));
}
