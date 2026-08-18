"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Pencil, Users } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { WORKSPACE_ROLE_LABELS } from "@/constants/workspace";
import { setActiveWorkspaceCookieAction } from "@/domains/workspace/actions/workspace.actions";
import { WorkspaceRenameDialog } from "@/domains/workspace/components/workspace-rename-dialog";
import {
  canManageWorkspaceTeam,
  formatWorkspaceOwnerLabel,
  getWorkspaceOwnerDisplayName,
} from "@/domains/workspace/utils/workspace.utils";
import type {
  UserWorkspace,
  WorkspaceRole,
} from "@/domains/workspace/types/workspace.types";
import { cn } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  workspaces: UserWorkspace[];
  activeWorkspaceSlug?: string;
  currentUserId: string;
  onManageTeam?: () => void;
};

function roleBadgeClass(role: WorkspaceRole) {
  if (role === "owner") return "bg-amber-500/15 text-amber-300";
  if (role === "admin") return "bg-cyan-500/15 text-cyan-300";
  return "bg-slate-500/15 text-slate-300";
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceSlug,
  currentUserId,
  onManageTeam,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSwitching, setIsSwitching] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const querySlug = searchParams.get("workspace");
  const active =
    workspaces.find((ws) => ws.slug === querySlug) ??
    workspaces.find((ws) => ws.slug === activeWorkspaceSlug) ??
    workspaces[0];

  async function handleSelect(slug: string) {
    if (!slug || slug === active?.slug) return;
    setIsSwitching(true);
    await setActiveWorkspaceCookieAction(slug);
    router.push(`${ROUTES.dashboard}?workspace=${encodeURIComponent(slug)}`);
    router.refresh();
    setIsSwitching(false);
  }

  if (!active) {
    return <span className="text-sm text-slate-400">Nenhum workspace</span>;
  }

  const canManage = canManageWorkspaceTeam(active.role);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isSwitching}
          className={cn(
            "inline-flex h-10 max-w-[220px] items-center gap-2 rounded-xl border border-slate-700/70",
            "bg-slate-900/50 px-3 text-sm font-medium text-slate-100",
            "transition-colors hover:border-slate-600 hover:bg-slate-800/80",
          )}
        >
          <span className="truncate">{active.name}</span>
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-72 border-slate-700/70 bg-[#0c1220] text-slate-100"
        >
          {workspaces.map((workspace) => {
            const ownerName = getWorkspaceOwnerDisplayName(workspace.owner);

            return (
              <DropdownMenuItem
                key={workspace.id}
                className={cn(
                  "flex flex-col items-start gap-1 focus:bg-slate-800/80",
                  workspace.slug === active.slug && "bg-slate-800/50",
                )}
                onClick={() => void handleSelect(workspace.slug)}
              >
                <span className="font-medium">{workspace.name}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>@{workspace.slug}</span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase",
                      roleBadgeClass(workspace.role),
                    )}
                  >
                    {WORKSPACE_ROLE_LABELS[workspace.role]}
                  </span>
                </span>
                <span className="text-xs text-slate-500">
                  {formatWorkspaceOwnerLabel({
                    ownerName,
                    ownerId: workspace.owner.id,
                    currentUserId,
                  })}
                </span>
              </DropdownMenuItem>
            );
          })}
          {canManage ? (
            <>
              <DropdownMenuSeparator className="bg-slate-700/60" />
              <DropdownMenuItem
                className="gap-2 focus:bg-slate-800/80"
                onClick={() => setRenameOpen(true)}
              >
                <Pencil className="size-4" />
                Renomear workspace
              </DropdownMenuItem>
              {onManageTeam ? (
                <DropdownMenuItem
                  className="gap-2 focus:bg-slate-800/80"
                  onClick={onManageTeam}
                >
                  <Users className="size-4" />
                  Gerenciar equipe
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceRenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        workspaceSlug={active.slug}
        defaultName={active.name}
      />
    </>
  );
}
