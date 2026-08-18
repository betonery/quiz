"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { ROUTES } from "@/constants/routes";
import { SubscriptionBanner } from "@/domains/billing/components/subscription-banner";
import { FolderSidebar } from "@/domains/dashboard/components/folder-sidebar";
import { CreateFunnelDialog } from "@/domains/quiz/components/create-funnel-dialog";
import { FunnelCard } from "@/domains/quiz/components/funnel-card";
import { useQuizFolders } from "@/domains/quiz/hooks/use-quiz-folders";
import { useQuizzes } from "@/domains/quiz/hooks/use-quizzes";
import type { QuizFolder } from "@/domains/quiz/types/quiz-folder.types";
import {
  folderFilterToQueryParam,
  parseFolderFilter,
  type FolderFilter,
} from "@/domains/quiz/types/quiz-folder.types";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import type { UserWorkspace } from "@/domains/workspace/types/workspace.types";
import { useToast } from "@/hooks/use-toast";

type ProjectsHomeProps = {
  workspaceSlug: string;
  workspaceName: string;
  initialQuizzes: Quiz[];
  initialFolders: QuizFolder[];
  workspaces: UserWorkspace[];
  canCreateQuiz: boolean;
  subscriptionMessage?: string;
  initialImportToken?: string;
  openImportOnLoad?: boolean;
};

function filterQuizzes(quizzes: Quiz[], filter: FolderFilter): Quiz[] {
  if (filter === "all") return quizzes;
  if (filter === "none") return quizzes.filter((quiz) => !quiz.folder_id);
  return quizzes.filter((quiz) => quiz.folder_id === filter);
}

function buildQuizCounts(quizzes: Quiz[], folders: QuizFolder[]) {
  const byFolder: Record<string, number> = {};
  for (const folder of folders) {
    byFolder[folder.id] = 0;
  }

  let none = 0;
  for (const quiz of quizzes) {
    if (!quiz.folder_id) {
      none += 1;
      continue;
    }
    byFolder[quiz.folder_id] = (byFolder[quiz.folder_id] ?? 0) + 1;
  }

  return {
    all: quizzes.length,
    none,
    byFolder,
  };
}

export function ProjectsHome({
  workspaceSlug,
  workspaceName,
  initialQuizzes,
  initialFolders,
  canCreateQuiz,
  subscriptionMessage,
  initialImportToken,
  openImportOnLoad = false,
}: ProjectsHomeProps) {
  const billingHref = ROUTES.billing(workspaceSlug);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const activeFilter = parseFolderFilter(searchParams.get("folder"));

  const {
    data: quizzes = initialQuizzes,
    isLoading: isLoadingQuizzes,
    isError: isQuizzesError,
  } = useQuizzes(workspaceSlug, initialQuizzes);

  const {
    data: folders = initialFolders,
    isLoading: isLoadingFolders,
    isError: isFoldersError,
  } = useQuizFolders(workspaceSlug, initialFolders);

  const filteredQuizzes = useMemo(
    () => filterQuizzes(quizzes, activeFilter),
    [quizzes, activeFilter],
  );

  const quizCounts = useMemo(
    () => buildQuizCounts(quizzes, folders),
    [quizzes, folders],
  );

  const activeFolderId =
    activeFilter !== "all" && activeFilter !== "none" ? activeFilter : null;

  const activeFolderName =
    activeFilter === "all"
      ? "Todos os funis"
      : activeFilter === "none"
        ? "Sem pasta"
        : (folders.find((folder) => folder.id === activeFilter)?.name ??
          "Pasta");

  useEffect(() => {
    if (!isQuizzesError && !isFoldersError) return;
    toast.error("Não foi possível carregar os funis.");
  }, [isQuizzesError, isFoldersError, toast]);

  function handleFilterChange(filter: FolderFilter) {
    const params = new URLSearchParams(searchParams.toString());
    const folderParam = folderFilterToQueryParam(filter);
    if (folderParam) {
      params.set("folder", folderParam);
    } else {
      params.delete("folder");
    }
    const query = params.toString();
    router.replace(query ? `${ROUTES.dashboard}?${query}` : ROUTES.dashboard, {
      scroll: false,
    });
  }

  const isLoading = isLoadingQuizzes || isLoadingFolders;
  const isError = isQuizzesError || isFoldersError;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {!canCreateQuiz && subscriptionMessage ? (
        <SubscriptionBanner
          workspaceSlug={workspaceSlug}
          message={subscriptionMessage}
        />
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Seus Funis
          </h1>
          <p className="max-w-xl text-sm text-slate-400">
            Aqui estão os funis do workspace{" "}
            <span className="font-medium text-slate-200">{workspaceName}</span>.
            {activeFilter !== "all" ? (
              <>
                {" "}
                Visualizando:{" "}
                <span className="font-medium text-slate-200">
                  {activeFolderName}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <CreateFunnelDialog
          workspaceSlug={workspaceSlug}
          folderId={activeFolderId}
          canCreateQuiz={canCreateQuiz}
          billingHref={billingHref}
          subscriptionMessage={subscriptionMessage}
          initialImportToken={initialImportToken}
          defaultOpen={openImportOnLoad}
          triggerClassName="h-10 rounded-xl border border-slate-600 bg-slate-900/60 px-4 text-sm font-medium text-white hover:border-cyan-500/40 hover:bg-slate-800"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <FolderSidebar
          folders={folders}
          workspaceSlug={workspaceSlug}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          quizCounts={quizCounts}
        />

        <div className="min-w-0 space-y-4">
          {isLoading ? (
            <p className="text-sm text-slate-400">Carregando funis...</p>
          ) : null}

          {!isLoading && !isError && filteredQuizzes.length === 0 ? (
            <EmptyState
              title={
                activeFilter === "all"
                  ? "Nenhum funil criado"
                  : "Nenhum funil nesta pasta"
              }
              description={
                canCreateQuiz
                  ? activeFilter === "all"
                    ? "Crie seu primeiro funil interativo para começar a engajar sua audiência."
                    : "Crie um funil nesta pasta ou mova funis existentes para cá."
                  : "Assine um plano para criar seu primeiro funil interativo."
              }
              action={
                canCreateQuiz ? (
                  <CreateFunnelDialog
                    workspaceSlug={workspaceSlug}
                    folderId={activeFolderId}
                    canCreateQuiz={canCreateQuiz}
                    billingHref={billingHref}
                    subscriptionMessage={subscriptionMessage}
                    triggerClassName="h-10 rounded-xl border border-slate-600 bg-slate-900/60 px-4 text-sm font-medium text-white hover:border-cyan-500/40 hover:bg-slate-800"
                  />
                ) : undefined
              }
            />
          ) : null}

          {!isLoading && !isError && filteredQuizzes.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <FunnelCard
                  key={quiz.id}
                  quiz={quiz}
                  workspaceSlug={workspaceSlug}
                  folders={folders}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
