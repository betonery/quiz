import { Logo } from "@/components/shared/logo";
import { UserNav } from "@/components/layout/user-nav";
import type {
  UserProfile,
  UserWorkspace,
} from "@/domains/workspace/types/workspace.types";

type HomeHeaderProps = {
  profile: UserProfile;
  workspaces: UserWorkspace[];
  activeWorkspaceSlug?: string;
  isPlatformStaff?: boolean;
};

export function HomeHeader({
  profile,
  workspaces,
  activeWorkspaceSlug,
  isPlatformStaff,
}: HomeHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0a0f1a]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-10">
        <Logo />
        <UserNav
          profile={profile}
          workspaces={workspaces}
          activeWorkspaceSlug={activeWorkspaceSlug}
          isPlatformStaff={isPlatformStaff}
        />
      </div>
    </header>
  );
}
