import { planLimitsSchema } from "@/domains/billing/schemas/plan-limits.schema";
import type { Plan } from "@/domains/billing/types/plan.types";
import { createClient } from "@/services/supabase/server";

function mapPlan(row: {
  id: string;
  name: string;
  description: string | null;
  limits: unknown;
  price_cents: number | null;
  checkout_url: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): Plan | null {
  const parsedLimits = planLimitsSchema.safeParse(row.limits);
  if (!parsedLimits.success) {
    console.error("[mapPlan] limits inválidos para plano", row.id);
    return null;
  }

  return {
    ...row,
    limits: parsedLimits.data,
  };
}

export async function listActivePlans(): Promise<Plan[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.flatMap((row) => {
    const plan = mapPlan(row);
    return plan ? [plan] : [];
  });
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapPlan(data);
}
