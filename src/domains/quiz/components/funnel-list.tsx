"use client";

import { useEffect } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateFunnelDialog } from "@/domains/quiz/components/create-funnel-dialog";
import { FunnelCard } from "@/domains/quiz/components/funnel-card";
import { useQuizzes } from "@/domains/quiz/hooks/use-quizzes";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import { useToast } from "@/hooks/use-toast";

type FunnelListProps = {
  workspaceSlug: string;
  initialQuizzes: Quiz[];
};

export function FunnelList({ workspaceSlug, initialQuizzes }: FunnelListProps) {
  const toast = useToast();
  const {
    data: quizzes = initialQuizzes,
    isLoading,
    isError,
  } = useQuizzes(workspaceSlug, initialQuizzes);

  useEffect(() => {
    if (!isError) return;
    toast.error("Não foi possível carregar os funis.");
  }, [isError, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Funis
        </h1>
        <CreateFunnelDialog workspaceSlug={workspaceSlug} />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando funis...</p>
      )}

      {!isLoading && !isError && quizzes.length === 0 && (
        <EmptyState
          title="Nenhum funil criado"
          description="Crie seu primeiro funil interativo para começar a engajar sua audiência."
          action={<CreateFunnelDialog workspaceSlug={workspaceSlug} />}
        />
      )}

      {!isLoading && !isError && quizzes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <FunnelCard
              key={quiz.id}
              quiz={quiz}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
