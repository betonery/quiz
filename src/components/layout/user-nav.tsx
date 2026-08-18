"use client";

import { CreditCard, LogOut, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { logoutAction } from "@/domains/auth/actions/logout.action";
import { TeamManagePanel } from "@/domains/workspace/components/team-manage-panel";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { ROUTES } from "@/constants/routes";
import type {
  UserProfile,
  UserWorkspace,
} from "@/domains/workspace/types/workspace.types";

type UserNavProps = {
  profile: UserProfile;
  workspaces: UserWorkspace[];
  activeWorkspaceSlug?: string;
  /** Exibe o atalho para o painel administrativo. */
  isPlatformStaff?: boolean;
};

export function UserNav({
  profile,
  workspaces,
  activeWorkspaceSlug,
  isPlatformStaff = false,
}: UserNavProps) {
  return (
    <Suspense fallback={<UserNavFallback />}>
      <UserNavContent
        profile={profile}
        workspaces={workspaces}
        activeWorkspaceSlug={activeWorkspaceSlug}
        isPlatformStaff={isPlatformStaff}
      />
    </Suspense>
  );
}

function UserNavFallback() {
  return <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-800/60" />;
}

function UserNavContent({
  profile,
  workspaces,
  activeWorkspaceSlug,
  isPlatformStaff,
}: UserNavProps) {
  const searchParams = useSearchParams();
  const querySlug = searchParams.get("workspace");
  const resolvedSlug =
    querySlug ?? activeWorkspaceSlug ?? workspaces[0]?.slug ?? "";

  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const displayName =
    profile.full_name?.trim() || profile.email.split("@")[0] || "Usuário";

  return (
    <>
      <div className="flex items-center gap-3 md:gap-4">
        <WorkspaceSwitcher
          workspaces={workspaces}
          activeWorkspaceSlug={activeWorkspaceSlug}
          currentUserId={profile.id}
          onManageTeam={() => setTeamPanelOpen(true)}
        />

        {isPlatformStaff ? (
          <Link
            href={ROUTES.admin.root}
            className="flex size-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/20"
            aria-label="Painel administrativo"
            title="Painel administrativo"
          >
            <ShieldCheck className="size-4" />
          </Link>
        ) : null}

        <Link
          href={ROUTES.dashboardPlan}
          className="flex size-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/50 text-slate-300 transition-colors hover:border-cyan-500/40 hover:bg-slate-800/80 hover:text-cyan-300"
          aria-label="Informações do plano"
          title="Plano"
        >
          <CreditCard className="size-4" />
        </Link>

        <Link
          href={ROUTES.dashboardProfile}
          className="hidden items-center gap-2 rounded-xl border border-transparent px-1 py-1 transition-colors hover:border-cyan-500/30 hover:bg-slate-800/50 sm:flex"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/80 text-slate-300">
            <User className="size-4" />
          </span>
          <span className="max-w-[140px] truncate text-sm font-medium text-slate-200">
            {displayName}
          </span>
        </Link>

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/50 text-slate-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>

      <TeamManagePanel
        open={teamPanelOpen}
        onOpenChange={setTeamPanelOpen}
        workspaceSlug={resolvedSlug}
      />
    </>
  );
}
