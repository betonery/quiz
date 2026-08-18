"use client";

import { useQuery } from "@tanstack/react-query";
import { folderKeys } from "@/lib/query-keys";
import type { QuizFolder } from "@/domains/quiz/types/quiz-folder.types";

async function fetchQuizFolders(workspaceSlug: string): Promise<QuizFolder[]> {
  const response = await fetch(`/api/workspaces/${workspaceSlug}/folders`);

  if (!response.ok) {
    throw new Error("Não foi possível carregar as pastas");
  }

  return response.json();
}

export function useQuizFolders(
  workspaceSlug: string,
  initialData?: QuizFolder[],
) {
  return useQuery({
    queryKey: folderKeys.list(workspaceSlug),
    queryFn: () => fetchQuizFolders(workspaceSlug),
    initialData,
  });
}
