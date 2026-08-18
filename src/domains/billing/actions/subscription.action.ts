"use server";

import { revalidatePath } from "next/cache";
import { planIdSchema } from "@/domains/billing/schemas/plan-limits.schema";
import { getPlanById } from "@/domains/billing/services/plan.service";
import { upsertWorkspaceSubscription } from "@/domains/billing/services/subscription.service";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/services/supabase/server";

type ActivatePlanResult = { success: true } | { success: false; error: string };

async function assertWorkspaceOwner(workspaceSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    throw new Error("Workspace não encontrado");
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) {
    throw new Error("Acesso negado");
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership?.role !== "owner") {
    throw new Error("Apenas o owner pode gerenciar a assinatura");
  }

  return workspace;
}

export async function activateWorkspacePlanAction(
  workspaceSlug: string,
  planId: string,
): Promise<ActivatePlanResult> {
  const parsedPlanId = planIdSchema.safeParse(planId);
  if (!parsedPlanId.success) {
    return { success: false, error: "Plano inválido" };
  }

  try {
    const workspace = await assertWorkspaceOwner(workspaceSlug);
    const plan = await getPlanById(parsedPlanId.data);

    if (!plan) {
      return { success: false, error: "Plano não encontrado" };
    }

    await upsertWorkspaceSubscription({
      workspaceId: workspace.id,
      planId: plan.id,
      status: "active",
    });

    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.billing(workspaceSlug));
    revalidatePath(ROUTES.dashboardPlan);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível ativar o plano",
    };
  }
}
