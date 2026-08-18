import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_WORKSPACE_COOKIE } from "@/constants/workspace";
import { ROUTES } from "@/constants/routes";
import { getWorkspaceSubscriptionWithPlan } from "@/domains/billing/services/subscription.service";
import { ProfilePageContent } from "@/domains/profile/components/profile-page-content";
import {
  getUserProfile,
  listWorkspacesForUser,
  resolveActiveWorkspaceForUser,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export const metadata = {
  title: "Meu perfil",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const workspaces = await listWorkspacesForUser(user.id);
  if (workspaces.length === 0) {
    redirect(ROUTES.login);
  }

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  const activeWorkspace = await resolveActiveWorkspaceForUser({
    userId: user.id,
    cookieSlug,
  });

  if (!activeWorkspace) {
    redirect(ROUTES.dashboard);
  }

  const [profile, subscription] = await Promise.all([
    getUserProfile(user.id),
    getWorkspaceSubscriptionWithPlan(activeWorkspace.id),
  ]);

  if (!profile) {
    redirect(ROUTES.login);
  }

  return (
    <ProfilePageContent
      profile={profile}
      workspaceName={activeWorkspace.name}
      workspaceSlug={activeWorkspace.slug}
      subscription={subscription}
    />
  );
}
