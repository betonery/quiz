"use server";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { assertCanAddCustomDomain } from "@/domains/billing/services/subscription.service";
import { addQuizCustomDomainSchema } from "@/domains/quiz/schemas/quiz-settings.schema";
import {
  getQuizCustomDomain,
  removeQuizCustomDomain,
  updateQuizCustomDomainStatus,
  upsertQuizCustomDomain,
} from "@/domains/quiz/services/quiz-custom-domain.service";
import { getQuizById } from "@/domains/quiz/services/quiz.service";
import {
  addProjectDomain,
  getProjectDomain,
  isVercelDomainConfigured,
  removeProjectDomain,
  resolveProjectDnsInstructions,
  verifyProjectDomain,
} from "@/domains/quiz/services/vercel-domain.service";
import type { QuizCustomDomain } from "@/domains/quiz/types/quiz-settings.types";
import type { QuizActionResult } from "@/domains/quiz/types/quiz.types";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

type DomainActionResult =
  | { success: true; domain: QuizCustomDomain }
  | { success: false; error: string };

async function assertQuizAccess(workspaceSlug: string, quizId: string) {
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

  const quiz = await getQuizById(workspace.id, quizId);
  if (!quiz) {
    throw new Error("Funil não encontrado");
  }

  return { workspace, quiz };
}

export async function addQuizCustomDomainAction(
  workspaceSlug: string,
  quizId: string,
  hostname: string,
): Promise<DomainActionResult> {
  const parsed = addQuizCustomDomainSchema.safeParse({
    quizId,
    workspaceSlug,
    hostname,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Domínio inválido",
    };
  }

  if (!isVercelDomainConfigured()) {
    return {
      success: false,
      error:
        "Domínios personalizados não estão configurados neste ambiente (VERCEL_API_TOKEN / VERCEL_PROJECT_ID).",
    };
  }

  try {
    const { workspace } = await assertQuizAccess(workspaceSlug, quizId);
    await assertCanAddCustomDomain(workspace.id);
    const normalizedHostname = parsed.data.hostname;

    let vercelResponse;
    try {
      vercelResponse = await addProjectDomain(normalizedHostname);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao registrar domínio";
      if (!message.toLowerCase().includes("already")) {
        throw error;
      }
      vercelResponse = await getProjectDomain(normalizedHostname);
    }

    const verificationRecords = await resolveProjectDnsInstructions(
      normalizedHostname,
      vercelResponse,
    );

    const domain = await upsertQuizCustomDomain({
      quizId,
      workspaceId: workspace.id,
      hostname: normalizedHostname,
      status: vercelResponse.verified ? "verified" : "pending",
      vercelDomainId: vercelResponse.name,
      verificationRecords,
    });

    revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
    return { success: true, domain };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao adicionar domínio",
    };
  }
}

export async function verifyQuizCustomDomainAction(
  workspaceSlug: string,
  quizId: string,
): Promise<DomainActionResult> {
  if (!isVercelDomainConfigured()) {
    return {
      success: false,
      error: "Integração com Vercel não configurada.",
    };
  }

  try {
    await assertQuizAccess(workspaceSlug, quizId);
    const existing = await getQuizCustomDomain(quizId);

    if (!existing) {
      return { success: false, error: "Nenhum domínio configurado" };
    }

    let vercelResponse = await verifyProjectDomain(existing.hostname).catch(
      async () => getProjectDomain(existing.hostname),
    );

    if (!vercelResponse.verified) {
      vercelResponse = await getProjectDomain(existing.hostname);
    }

    const domain = await updateQuizCustomDomainStatus(existing.id, {
      status: vercelResponse.verified ? "verified" : "pending",
      verificationRecords: await resolveProjectDnsInstructions(
        existing.hostname,
        vercelResponse,
      ),
      vercelDomainId: vercelResponse.name,
    });

    revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
    return { success: true, domain };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao verificar domínio",
    };
  }
}

export async function removeQuizCustomDomainAction(
  workspaceSlug: string,
  quizId: string,
): Promise<QuizActionResult> {
  try {
    await assertQuizAccess(workspaceSlug, quizId);
    const existing = await getQuizCustomDomain(quizId);

    if (!existing) {
      return { success: true, quizId };
    }

    if (isVercelDomainConfigured()) {
      await removeProjectDomain(existing.hostname).catch(() => undefined);
    }

    await removeQuizCustomDomain(existing.id);
    revalidatePath(ROUTES.quiz(workspaceSlug, quizId));
    return { success: true, quizId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao remover domínio",
    };
  }
}
