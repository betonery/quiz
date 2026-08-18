import { notFound } from "next/navigation";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);

  if (!workspace) {
    notFound();
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);

  if (!hasAccess) {
    notFound();
  }

  return children;
}
