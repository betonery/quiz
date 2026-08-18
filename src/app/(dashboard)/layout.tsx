import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeShell } from "@/components/layout/home-shell";
import { ACTIVE_WORKSPACE_COOKIE } from "@/constants/workspace";
import { ROUTES } from "@/constants/routes";
import { MaintenanceScreen } from "@/domains/admin/components/maintenance-screen";
import { getAdminActor } from "@/domains/admin/services/admin-guard.service";
import { getCachedPlatformSettings } from "@/domains/admin/services/admin-settings.service";
import {
  getUserProfile,
  listWorkspacesForUser,
} from "@/domains/workspace/services/workspace.service";
import type { UserProfile } from "@/domains/workspace/types/workspace.types";
import { createClient } from "@/services/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardGroupLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const [profileRow, workspaces, settings, adminActor] = await Promise.all([
    getUserProfile(user.id),
    listWorkspacesForUser(user.id),
    getCachedPlatformSettings(),
    getAdminActor(),
  ]);

  // Manutenção só barra usuários comuns — a equipe precisa entrar para resolver.
  if (settings.maintenanceMode && !adminActor) {
    return (
      <MaintenanceScreen
        message={settings.maintenanceMessage}
        supportEmail={settings.supportEmail}
      />
    );
  }

  const profile =
    profileRow ??
    ({
      id: user.id,
      email: user.email ?? "",
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
      avatar_url:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
      created_at: user.created_at ?? new Date().toISOString(),
    } satisfies UserProfile);

  const cookieStore = await cookies();
  const activeWorkspaceSlug = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  return (
    <HomeShell
      profile={profile}
      workspaces={workspaces}
      activeWorkspaceSlug={activeWorkspaceSlug}
      isPlatformStaff={adminActor !== null}
      announcement={settings.globalAnnouncement}
    >
      {children}
    </HomeShell>
  );
}
