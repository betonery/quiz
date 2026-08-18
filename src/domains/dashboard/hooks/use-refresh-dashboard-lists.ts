"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { folderKeys, quizKeys } from "@/lib/query-keys";

export function useRefreshDashboardLists(workspaceSlug: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: quizKeys.list(workspaceSlug),
    });
    void queryClient.invalidateQueries({
      queryKey: folderKeys.list(workspaceSlug),
    });
    router.refresh();
  }, [queryClient, router, workspaceSlug]);
}
