import { notFound } from "next/navigation";
import { EditorShell } from "@/domains/quiz/components/builder/editor-shell";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

type EditorLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
};

export default async function EditorLayout({
  children,
  params,
}: EditorLayoutProps) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) notFound();

  return <EditorShell>{children}</EditorShell>;
}
