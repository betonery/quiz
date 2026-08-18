"use client";

import { useQuery } from "@tanstack/react-query";
import { quizKeys } from "@/lib/query-keys";
import type { Quiz } from "@/domains/quiz/types/quiz.types";

async function fetchQuizzes(workspaceSlug: string): Promise<Quiz[]> {
  const response = await fetch(`/api/workspaces/${workspaceSlug}/quizzes`);

  if (!response.ok) {
    throw new Error("Não foi possível carregar os funis");
  }

  return response.json();
}

export function useQuizzes(workspaceSlug: string, initialData?: Quiz[]) {
  return useQuery({
    queryKey: quizKeys.list(workspaceSlug),
    queryFn: () => fetchQuizzes(workspaceSlug),
    initialData,
  });
}
