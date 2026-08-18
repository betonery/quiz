import { NextResponse } from "next/server";
import { listQuizzesByWorkspaceId } from "@/domains/quiz/services/quiz.service";
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

  try {
    const quizzes = await listQuizzesByWorkspaceId(workspace.id);
    return NextResponse.json(quizzes);
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar funis" },
      { status: 500 },
    );
  }
}
