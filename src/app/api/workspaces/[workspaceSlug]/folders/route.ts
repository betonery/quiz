import { NextResponse } from "next/server";
import { listQuizFoldersByWorkspaceId } from "@/domains/quiz/services/quiz-folder.service";
import { getWorkspaceBySlug } from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

type RouteParams = {
  params: Promise<{ workspaceSlug: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace não encontrado" },
      { status: 404 },
    );
  }

  const folders = await listQuizFoldersByWorkspaceId(workspace.id);
  return NextResponse.json(folders);
}
