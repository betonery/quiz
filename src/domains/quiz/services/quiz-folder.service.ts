import { createClient } from "@/services/supabase/server";
import type { QuizFolder } from "@/domains/quiz/types/quiz-folder.types";

const FOLDER_COLUMNS =
  "id, workspace_id, name, created_by, sort_order, created_at, updated_at" as const;

function mapFolder(row: {
  id: string;
  workspace_id: string;
  name: string;
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}): QuizFolder {
  return row;
}

export async function listQuizFoldersByWorkspaceId(
  workspaceId: string,
): Promise<QuizFolder[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_folders")
    .select(FOLDER_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[listQuizFoldersByWorkspaceId]", error.message);
    return [];
  }

  return (data ?? []).map(mapFolder);
}

export async function getQuizFolderById(
  workspaceId: string,
  folderId: string,
): Promise<QuizFolder | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_folders")
    .select(FOLDER_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("id", folderId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapFolder(data);
}

export async function createQuizFolder(
  workspaceId: string,
  userId: string,
  name: string,
): Promise<QuizFolder> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("quiz_folders")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const { data, error } = await supabase
    .from("quiz_folders")
    .insert({
      workspace_id: workspaceId,
      name,
      created_by: userId,
      sort_order: count ?? 0,
    })
    .select(FOLDER_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível criar a pasta");
  }

  return mapFolder(data);
}

export async function renameQuizFolder(
  workspaceId: string,
  folderId: string,
  name: string,
): Promise<QuizFolder> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_folders")
    .update({ name })
    .eq("workspace_id", workspaceId)
    .eq("id", folderId)
    .select(FOLDER_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível renomear a pasta");
  }

  return mapFolder(data);
}

export async function deleteQuizFolder(
  workspaceId: string,
  folderId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quiz_folders")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", folderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function moveQuizToFolder(
  workspaceId: string,
  quizId: string,
  folderId: string | null,
): Promise<void> {
  if (folderId) {
    const folder = await getQuizFolderById(workspaceId, folderId);
    if (!folder) {
      throw new Error("Pasta não encontrada");
    }
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ folder_id: folderId })
    .eq("workspace_id", workspaceId)
    .eq("id", quizId);

  if (error) {
    throw new Error(error.message);
  }
}
