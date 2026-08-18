import type { AdminTrendPoint } from "@/domains/admin/types/admin.types";

/** Chave de dia em UTC — mantém o agrupamento estável entre servidor e testes. */
export function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function daysAgo(days: number, now: Date = new Date()): Date {
  const date = new Date(now.getTime());
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

export function countSince(
  rows: { created_at: string }[],
  since: Date,
): number {
  const threshold = since.getTime();
  let total = 0;
  for (const row of rows) {
    const time = new Date(row.created_at).getTime();
    if (Number.isFinite(time) && time >= threshold) total += 1;
  }
  return total;
}

/**
 * MRR estimado: soma do preço do plano de cada assinatura ativa.
 * Assinaturas cujo plano sumiu (ou sem preço) contam como zero.
 */
export function calculateMrrCents(
  subscriptions: { plan_id: string; status: string }[],
  planPriceById: Map<string, number | null>,
): number {
  let total = 0;
  for (const subscription of subscriptions) {
    if (subscription.status !== "active") continue;
    total += planPriceById.get(subscription.plan_id) ?? 0;
  }
  return total;
}

export function sumPaymentsCents(
  payments: { amount_cents: number; status: string; created_at: string }[],
  options: { status?: string; since?: Date } = {},
): number {
  const threshold = options.since?.getTime();
  let total = 0;
  for (const payment of payments) {
    if (options.status && payment.status !== options.status) continue;
    if (threshold !== undefined) {
      const time = new Date(payment.created_at).getTime();
      if (!Number.isFinite(time) || time < threshold) continue;
    }
    total += payment.amount_cents;
  }
  return total;
}

export function countByStatus<T extends { status: string }>(
  rows: T[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.status] = (result[row.status] ?? 0) + 1;
  }
  return result;
}

/**
 * Série diária contínua dos últimos `days` dias — inclui dias sem registro
 * para que o gráfico não distorça o eixo.
 */
export function buildTrend(params: {
  users: { created_at: string }[];
  quizzes: { created_at: string }[];
  days: number;
  now?: Date;
}): AdminTrendPoint[] {
  const now = params.now ?? new Date();
  const userCounts = new Map<string, number>();
  const quizCounts = new Map<string, number>();

  for (const user of params.users) {
    const key = dayKey(user.created_at);
    if (key) userCounts.set(key, (userCounts.get(key) ?? 0) + 1);
  }
  for (const quiz of params.quizzes) {
    const key = dayKey(quiz.created_at);
    if (key) quizCounts.set(key, (quizCounts.get(key) ?? 0) + 1);
  }

  const points: AdminTrendPoint[] = [];
  for (let offset = params.days - 1; offset >= 0; offset -= 1) {
    const key = dayKey(daysAgo(offset, now));
    points.push({
      date: key,
      users: userCounts.get(key) ?? 0,
      quizzes: quizCounts.get(key) ?? 0,
    });
  }

  return points;
}

export function sumTrafficMetrics(
  rows: { views: number; starts: number; completions: number }[],
): { views: number; starts: number; completions: number } {
  return rows.reduce(
    (acc, row) => ({
      views: acc.views + row.views,
      starts: acc.starts + row.starts,
      completions: acc.completions + row.completions,
    }),
    { views: 0, starts: 0, completions: 0 },
  );
}

/** Normaliza uma série para altura de barra em porcentagem (0–100). */
export function normalizeToPercent(values: number[]): number[] {
  const max = Math.max(...values, 0);
  if (max <= 0) return values.map(() => 0);
  return values.map((value) => Math.round((value / max) * 100));
}
