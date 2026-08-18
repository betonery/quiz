import type {
  QuizDailyMetric,
  QuizStatistics,
  QuizStatisticsPeriod,
} from "@/domains/quiz/types/statistics.types";

export function filterStatisticsByPeriod(
  statistics: QuizStatistics,
  period: QuizStatisticsPeriod,
): QuizStatistics {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (period - 1));
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const daily = statistics.daily.filter((item) => item.date >= cutoffKey);
  const views = daily.reduce((sum, item) => sum + item.views, 0);
  const starts = daily.reduce((sum, item) => sum + item.starts, 0);
  const completions = daily.reduce((sum, item) => sum + item.completions, 0);

  return {
    ...statistics,
    views,
    starts,
    completions,
    conversionRate:
      views > 0 ? Math.round((completions / views) * 1000) / 10 : 0,
    daily,
  };
}

export function formatMetricNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatMetricPercent(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function formatMetricDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function buildStepFunnelRows(
  steps: { id: string; title: string; position: number }[],
  stepMetrics: QuizStatistics["stepMetrics"],
) {
  const viewsByStep = new Map(
    stepMetrics.map((item) => [item.stepId, item.views]),
  );
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position);
  const maxViews = Math.max(
    ...sortedSteps.map((step) => viewsByStep.get(step.id) ?? 0),
    1,
  );

  return sortedSteps.map((step, index) => {
    const views = viewsByStep.get(step.id) ?? 0;
    const previousViews =
      index === 0
        ? views
        : (viewsByStep.get(sortedSteps[index - 1]?.id ?? "") ?? 0);
    const dropOff =
      index === 0 || previousViews === 0
        ? 0
        : Math.round(((previousViews - views) / previousViews) * 1000) / 10;

    return {
      stepId: step.id,
      title: step.title,
      position: step.position,
      views,
      widthPercent: Math.max(4, Math.round((views / maxViews) * 100)),
      dropOff,
    };
  });
}

export function getDailyChartMax(daily: QuizDailyMetric[]): number {
  return Math.max(...daily.map((item) => item.views), 1);
}
