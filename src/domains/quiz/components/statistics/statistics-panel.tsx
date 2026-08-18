"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { QuizStatisticsPeriod } from "@/domains/quiz/types/statistics.types";
import type { QuizStatistics } from "@/domains/quiz/types/statistics.types";
import type { QuizStatus } from "@/domains/quiz/types/quiz.types";
import {
  buildStepFunnelRows,
  filterStatisticsByPeriod,
  formatMetricDate,
  formatMetricNumber,
  formatMetricPercent,
  getDailyChartMax,
} from "@/domains/quiz/utils/quiz-statistics.utils";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: QuizStatisticsPeriod; label: string }[] = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
];

type StatisticsPanelProps = {
  initialStatistics: QuizStatistics;
  quizStatus: QuizStatus;
  publishedAt: string | null;
};

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
};

function KpiCard({ label, value, hint, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-[#0c1220]/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand-secondary/15 text-brand-secondary">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function StatisticsPanel({
  initialStatistics,
  quizStatus,
  publishedAt,
}: StatisticsPanelProps) {
  const steps = useBuilderStore((s) => s.steps);
  const [period, setPeriod] = useState<QuizStatisticsPeriod>(30);

  const statistics = useMemo(
    () => filterStatisticsByPeriod(initialStatistics, period),
    [initialStatistics, period],
  );

  const funnelRows = useMemo(
    () => buildStepFunnelRows(steps, statistics.stepMetrics),
    [steps, statistics.stepMetrics],
  );

  const dailyMax = getDailyChartMax(statistics.daily);
  const isPublished = quizStatus === "published";
  const hasData = statistics.views > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950/20">
      <div className="border-b border-slate-700/60 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Estatísticas
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-100">
              Desempenho do funil
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Visualizações, conclusões e abandono por etapa
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-700/60 bg-[#0c1220] p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  period === option.value
                    ? "bg-brand-secondary text-white"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          {!isPublished ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
              Publique o funil para começar a coletar estatísticas reais dos
              visitantes.
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Visualizações"
              value={formatMetricNumber(statistics.views)}
              hint="Acessos únicos por sessão"
              icon={Eye}
            />
            <KpiCard
              label="Inícios"
              value={formatMetricNumber(statistics.starts)}
              hint="Visitantes que entraram no funil"
              icon={MousePointerClick}
            />
            <KpiCard
              label="Conclusões"
              value={formatMetricNumber(statistics.completions)}
              hint="Finalizações ou redirecionamentos"
              icon={CheckCircle2}
            />
            <KpiCard
              label="Conversão"
              value={formatMetricPercent(statistics.conversionRate)}
              hint="Conclusões / visualizações"
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-700/60 bg-[#0c1220]/60 p-5">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="size-4 text-brand-secondary" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Visualizações por dia
                </h3>
              </div>

              {!hasData ? (
                <div className="rounded-xl border border-dashed border-slate-700/80 px-4 py-10 text-center text-sm text-slate-400">
                  {isPublished
                    ? "Ainda não há dados no período selecionado."
                    : "Os gráficos aparecerão após a publicação."}
                </div>
              ) : (
                <div className="flex h-44 items-end gap-2">
                  {statistics.daily.map((item) => (
                    <div
                      key={item.date}
                      className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex h-32 w-full items-end justify-center">
                        <div
                          className="w-full max-w-8 rounded-t-md bg-brand-secondary/80"
                          style={{
                            height: `${Math.max(8, Math.round((item.views / dailyMax) * 100))}%`,
                          }}
                          title={`${formatMetricDate(item.date)}: ${item.views}`}
                        />
                      </div>
                      <span className="truncate text-[10px] text-slate-500">
                        {formatMetricDate(item.date)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-700/60 bg-[#0c1220]/60 p-5">
              <h3 className="text-sm font-semibold text-slate-100">
                Resumo do período
              </h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
                  <dt className="text-slate-400">Status</dt>
                  <dd className="font-medium text-slate-100">
                    {isPublished ? "Publicado" : "Rascunho"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
                  <dt className="text-slate-400">Publicado em</dt>
                  <dd className="font-medium text-slate-100">
                    {publishedAt
                      ? new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(publishedAt))
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
                  <dt className="text-slate-400">Etapas no funil</dt>
                  <dd className="font-medium text-slate-100">{steps.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Taxa de início</dt>
                  <dd className="font-medium text-slate-100">
                    {statistics.views > 0
                      ? formatMetricPercent(
                          (statistics.starts / statistics.views) * 100,
                        )
                      : "0%"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-700/60 bg-[#0c1220]/60 p-5">
            <h3 className="text-sm font-semibold text-slate-100">
              Funil por etapa
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Quantas visualizações cada etapa recebeu e onde ocorre abandono
            </p>

            {funnelRows.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-700/80 px-4 py-8 text-center text-sm text-slate-400">
                Adicione etapas ao funil para ver o funil de conversão.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {funnelRows.map((row, index) => (
                  <div key={row.stepId} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-100">
                          {index + 1}. {row.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatMetricNumber(row.views)} visualizações
                          {index > 0 && row.dropOff > 0
                            ? ` · ${formatMetricPercent(row.dropOff)} de abandono`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand-secondary"
                        style={{ width: `${row.widthPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
