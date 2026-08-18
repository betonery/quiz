export type QuizStatus = "draft" | "published" | "archived";

export type Quiz = {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  title: string;
  slug: string;
  status: QuizStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type QuizActionResult =
  | { success: true; quizId?: string }
  | { success: false; error: string };
