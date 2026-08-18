import "server-only";

import type {
  AdminListParams,
  AdminListResult,
  AdminQuizRow,
} from "@/domains/admin/types/admin.types";
import {
  buildOrIlikeFilter,
  clampPage,
  indexBy,
  pageCountFor,
  toRange,
} from "@/domains/admin/utils/admin-query.utils";
import type { QuizStatus } from "@/domains/quiz/types/quiz.types";
import { createAdminClient } from "@/services/supabase/admin";

type QuizRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

async function decorateQuizzes(rows: QuizRow[]): Promise<AdminQuizRow[]> {
  if (rows.length === 0) return [];

  const admin = createAdminClient();
  const workspaceIds = [...new Set(rows.map((row) => row.workspace_id))];
  const quizIds = rows.map((row) => row.id);

  const [workspaceResult, metricsResult] = await Promise.all([
    admin.from("workspaces").select("id, name, slug").in("id", workspaceIds),
    admin
      .from("quiz_daily_metrics")
      .select("quiz_id, views, starts, completions")
      .in("quiz_id", quizIds),
  ]);

  const workspaceById = indexBy(workspaceResult.data ?? [], (row) => row.id);

  const totals = new Map<
    string,
    { views: number; starts: number; completions: number }
  >();
  for (const metric of metricsResult.data ?? []) {
    const current = totals.get(metric.quiz_id) ?? {
      views: 0,
      starts: 0,
      completions: 0,
    };
    totals.set(metric.quiz_id, {
      views: current.views + metric.views,
      starts: current.starts + metric.starts,
      completions: current.completions + metric.completions,
    });
  }

  return rows.map((row) => {
    const workspace = workspaceById.get(row.workspace_id);
    const metrics = totals.get(row.id) ?? {
      views: 0,
      starts: 0,
      completions: 0,
    };

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status as QuizStatus,
      workspaceId: row.workspace_id,
      workspaceName: workspace?.name ?? null,
      workspaceSlug: workspace?.slug ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      ...metrics,
    };
  });
}

export async function listQuizzes(
  params: AdminListParams & { status?: string; workspaceId?: string },
): Promise<AdminListResult<AdminQuizRow>> {
  const admin = createAdminClient();

  const buildQuery = () => {
    let query = admin
      .from("quizzes")
      .select(
        "id, title, slug, status, workspace_id, created_at, updated_at, published_at",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false });

    if (params.search) {
      query = query.or(buildOrIlikeFilter(["title", "slug"], params.search));
    }
    if (params.status) query = query.eq("status", params.status);
    if (params.workspaceId)
      query = query.eq("workspace_id", params.workspaceId);

    return query;
  };

  const { count } = await buildQuery().range(0, 0);
  const total = count ?? 0;
  const page = clampPage(params.page, total, params.pageSize);
  const { from, to } = toRange(page, params.pageSize);

  const { data, error } = await buildQuery().range(from, to);

  if (error || !data) {
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: params.pageSize,
      pageCount: 1,
    };
  }

  return {
    items: await decorateQuizzes(data),
    total,
    page,
    pageSize: params.pageSize,
    pageCount: pageCountFor(total, params.pageSize),
  };
}

export async function getQuizRow(quizId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("quizzes")
    .select("id, title, slug, status, workspace_id")
    .eq("id", quizId)
    .maybeSingle();

  return data;
}

/**
 * Moderação: derruba o funil do ar sem apagar nada. Limpa o snapshot para que
 * a rota pública deixe de servir a versão publicada imediatamente.
 */
export async function unpublishQuiz(quizId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("quizzes")
    .update({
      status: "draft",
      published_at: null,
      published_content: null,
    })
    .eq("id", quizId);

  return !error;
}

export async function deleteQuiz(quizId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("quizzes").delete().eq("id", quizId);
  return !error;
}

export async function listQuizzesForMetrics(): Promise<
  { created_at: string; status: string }[]
> {
  const admin = createAdminClient();
  const { data } = await admin.from("quizzes").select("created_at, status");
  return data ?? [];
}

export async function sumTrafficSince(
  sinceDate: string,
): Promise<{ views: number; starts: number; completions: number }> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("quiz_daily_metrics")
    .select("views, starts, completions")
    .gte("metric_date", sinceDate);

  return (data ?? []).reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      starts: acc.starts + row.starts,
      completions: acc.completions + row.completions,
    }),
    { views: 0, starts: 0, completions: 0 },
  );
}
