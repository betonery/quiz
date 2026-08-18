import type { ReactNode } from "react";
import { HomeHeader } from "@/components/layout/home-header";
import type {
  UserProfile,
  UserWorkspace,
} from "@/domains/workspace/types/workspace.types";

type HomeShellProps = {
  children: ReactNode;
  profile: UserProfile;
  workspaces: UserWorkspace[];
  activeWorkspaceSlug?: string;
  isPlatformStaff?: boolean;
  /** Aviso definido em Configurações da plataforma. */
  announcement?: string | null;
};

export function HomeShell({
  children,
  profile,
  workspaces,
  activeWorkspaceSlug,
  isPlatformStaff,
  announcement,
}: HomeShellProps) {
  return (
    <div className="home-dashboard min-h-screen bg-[#0a0f1a] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.12) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative flex min-h-screen flex-col">
        <HomeHeader
          profile={profile}
          workspaces={workspaces}
          activeWorkspaceSlug={activeWorkspaceSlug}
          isPlatformStaff={isPlatformStaff}
        />
        {announcement ? (
          <div className="border-b border-cyan-500/20 bg-cyan-500/10 px-6 py-2.5 text-center text-sm text-cyan-200 md:px-10">
            {announcement}
          </div>
        ) : null}
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
