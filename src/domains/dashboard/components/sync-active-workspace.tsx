"use client";

import { useEffect } from "react";
import { setActiveWorkspaceCookieAction } from "@/domains/workspace/actions/workspace.actions";

type SyncActiveWorkspaceProps = {
  workspaceSlug: string;
};

export function SyncActiveWorkspace({
  workspaceSlug,
}: SyncActiveWorkspaceProps) {
  useEffect(() => {
    void setActiveWorkspaceCookieAction(workspaceSlug);
  }, [workspaceSlug]);

  return null;
}
