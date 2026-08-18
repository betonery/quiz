export type QuizFolder = {
  id: string;
  workspace_id: string;
  name: string;
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type QuizFolderActionResult =
  | { success: true; folderId?: string }
  | { success: false; error: string };

export type FolderFilter = "all" | "none" | string;

export function parseFolderFilter(
  value: string | null | undefined,
): FolderFilter {
  if (!value || value === "all") return "all";
  if (value === "none") return "none";
  return value;
}

export function folderFilterToQueryParam(
  filter: FolderFilter,
): string | undefined {
  if (filter === "all") return undefined;
  return filter;
}
