import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsHome } from "@/domains/dashboard/components/projects-home";
import { SyncActiveWorkspace } from "@/domains/dashboard/components/sync-active-workspace";
import { ACTIVE_WORKSPACE_COOKIE } from "@/constants/workspace";
import { ROUTES } from "@/constants/routes";
import { getCreateQuizAccess } from "@/domains/billing/services/subscription.service";
import { listQuizFoldersByWorkspaceId } from "@/domains/quiz/services/quiz-folder.service";
import { listQuizzesByWorkspaceId } from "@/domains/quiz/services/quiz.service";
import {
  listWorkspacesForUser,
  resolveActiveWorkspaceForUser,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export const metadata = {
  title: "Seus Funis",
};

type DashboardPageProps = {
  searchParams: Promise<{ workspace?: string; importToken?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { workspace: queryWorkspace, importToken } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const workspaces = await listWorkspacesForUser(user.id);
  if (workspaces.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-white">
          Nenhum workspace encontrado
        </h1>
        <p className="text-sm text-slate-400">
          Sua conta ainda não está associada a um workspace. Entre em contato
          com o suporte ou aceite um convite pendente.
        </p>
      </div>
    );
  }

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  const activeWorkspace = await resolveActiveWorkspaceForUser({
    userId: user.id,
    querySlug: queryWorkspace,
    cookieSlug,
  });

  if (!activeWorkspace) {
    return (
      <div className="mx-auto max-w-lg space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-white">
          Workspace indisponível
        </h1>
        <p className="text-sm text-slate-400">
          Não foi possível resolver o workspace ativo. Selecione outro workspace
          no menu superior.
        </p>
      </div>
    );
  }

  const [quizzes, folders] = await Promise.all([
    listQuizzesByWorkspaceId(activeWorkspace.id),
    listQuizFoldersByWorkspaceId(activeWorkspace.id),
  ]);

  let createQuizAccess: Awaited<ReturnType<typeof getCreateQuizAccess>>;
  try {
    createQuizAccess = await getCreateQuizAccess(activeWorkspace.id);
  } catch (error) {
    console.error("[DashboardPage] getCreateQuizAccess", error);
    createQuizAccess = {
      allowed: false,
      reason: "no_subscription",
      message:
        "Assinatura necessária para criar funis. Escolha um plano para continuar.",
    };
  }

  return (
    <>
      <SyncActiveWorkspace workspaceSlug={activeWorkspace.slug} />
      <Suspense
        fallback={<p className="text-sm text-slate-400">Carregando funis...</p>}
      >
        <ProjectsHome
          workspaceSlug={activeWorkspace.slug}
          workspaceName={activeWorkspace.name}
          initialQuizzes={quizzes}
          initialFolders={folders}
          workspaces={workspaces}
          canCreateQuiz={createQuizAccess.allowed}
          subscriptionMessage={
            createQuizAccess.allowed ? undefined : createQuizAccess.message
          }
          initialImportToken={importToken}
          openImportOnLoad={Boolean(importToken)}
        />
      </Suspense>
    </>
  );
}
