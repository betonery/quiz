export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...workspaceKeys.lists(), filters] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (slug: string) => [...workspaceKeys.details(), slug] as const,
};

export const folderKeys = {
  all: ["quiz-folders"] as const,
  lists: () => [...folderKeys.all, "list"] as const,
  list: (workspaceSlug: string) =>
    [...folderKeys.lists(), workspaceSlug] as const,
};

export const quizKeys = {
  all: ["quizzes"] as const,
  lists: () => [...quizKeys.all, "list"] as const,
  list: (workspaceSlug: string) =>
    [...quizKeys.lists(), workspaceSlug] as const,
  details: () => [...quizKeys.all, "detail"] as const,
  detail: (quizId: string) => [...quizKeys.details(), quizId] as const,
  public: (slug: string) => [...quizKeys.all, "public", slug] as const,
};

export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboard: (workspaceSlug: string) =>
    [...analyticsKeys.all, "dashboard", workspaceSlug] as const,
};
