import "server-only";

import {
  emptyQuizStatistics,
  type QuizStatistics,
  type QuizStatisticsPeriod,
} from "@/domains/quiz/types/statistics.types";
import { createClient } from "@/services/supabase/server";

function parseQuizStatistics(raw: unknown): QuizStatistics {
  if (!raw || typeof raw !== "object") {
    return emptyQuizStatistics;
  }

  const data = raw as Record<string, unknown>;

  return {
    views: typeof data.views === "number" ? data.views : 0,
    starts: typeof data.starts === "number" ? data.starts : 0,
    completions: typeof data.completions === "number" ? data.completions : 0,
    conversionRate:
      typeof data.conversionRate === "number" ? data.conversionRate : 0,
    daily: Array.isArray(data.daily)
      ? data.daily
          .filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object",
          )
          .map((item) => ({
            date: String(item.date ?? ""),
            views: typeof item.views === "number" ? item.views : 0,
            starts: typeof item.starts === "number" ? item.starts : 0,
            completions:
              typeof item.completions === "number" ? item.completions : 0,
          }))
      : [],
    stepMetrics: Array.isArray(data.stepMetrics)
      ? data.stepMetrics
          .filter(
            (item): item is Record<string, unknown> =>
              !!item && typeof item === "object",
          )
          .map((item) => ({
            stepId: String(item.stepId ?? ""),
            views: typeof item.views === "number" ? item.views : 0,
          }))
      : [],
  };
}

export async function getQuizStatistics(
  quizId: string,
  days: QuizStatisticsPeriod = 30,
): Promise<QuizStatistics> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_quiz_statistics", {
    p_quiz_id: quizId,
    p_days: days,
  });

  if (error) {
    console.error("[getQuizStatistics]", error.message);
    return emptyQuizStatistics;
  }

  return parseQuizStatistics(data);
}
