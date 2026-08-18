import type {
  PaymentStatus,
  WorkspacePayment,
} from "@/domains/billing/types/plan.types";
import { createClient } from "@/services/supabase/server";

function mapPayment(row: {
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
}): WorkspacePayment {
  return {
    ...row,
    status: row.status as PaymentStatus,
  };
}

export async function listWorkspacePayments(
  workspaceId: string,
  limit = 20,
): Promise<WorkspacePayment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_payments")
    .select(
      "id, workspace_id, plan_id, external_payment_id, provider, amount_cents, payment_method, period_start, period_end, status, created_at",
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map(mapPayment);
}
