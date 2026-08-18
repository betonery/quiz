export type QuizStatisticsPeriod = 7 | 30 | 90;

export type QuizDailyMetric = {
  date: string;
  views: number;
  starts: number;
  completions: number;
};

export type QuizStepMetric = {
  stepId: string;
  views: number;
};

export type QuizStatistics = {
  views: number;
  starts: number;
  completions: number;
  conversionRate: number;
  daily: QuizDailyMetric[];
  stepMetrics: QuizStepMetric[];
};

export const emptyQuizStatistics: QuizStatistics = {
  views: 0,
  starts: 0,
  completions: 0,
  conversionRate: 0,
  daily: [],
  stepMetrics: [],
};

export type QuizAnalyticsEvent = "view" | "start" | "complete" | "step_view";
