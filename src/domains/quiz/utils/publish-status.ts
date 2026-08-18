import type { Quiz } from "@/domains/quiz/types/quiz.types";

export function hasUnpublishedChanges(quiz: Quiz): boolean {
  if (quiz.status !== "published" || !quiz.published_at) {
    return quiz.status === "draft";
  }
  return new Date(quiz.updated_at) > new Date(quiz.published_at);
}
