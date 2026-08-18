"use client";

import { useAnimatedPercentage } from "@/domains/quiz/hooks/use-animated-percentage";
import type { ChartsWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { QuizDesignSettings } from "@/domains/quiz/types/design.types";
import type {
  ChartItem,
  ChartsDisposition,
} from "@/domains/quiz/types/media.types";
import {
  CHART_TRACK_COLOR,
  clampChartValue,
  getChartsGridClass,
  resolveChartColor,
  resolveChartLegendHtml,
  resolveChartLegendPlain,
} from "@/domains/quiz/utils/charts-widget.utils";
import { cn } from "@/lib/utils";

type ChartsWidgetRendererProps = {
  config: ChartsWidgetConfig;
  design: QuizDesignSettings;
  variables?: Record<string, unknown>;
  animate?: boolean;
  className?: string;
};

function BarChartVisual({
  value,
  fillColor,
  animate,
}: {
  value: number;
  fillColor: string;
  animate: boolean;
}) {
  const clamped = clampChartValue(value);
  const { value: animatedValue } = useAnimatedPercentage(clamped, { animate });
  const displayValue = Math.round(animatedValue);

  return (
    <div className="relative mx-auto flex h-32 w-16 flex-col items-center">
      <span className="mb-2 text-xs font-medium tabular-nums text-slate-600">
        {displayValue}%
      </span>
      <div
        className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md"
        style={{ backgroundColor: CHART_TRACK_COLOR }}
      >
        <div
          className="w-full transition-[height] duration-300 ease-out"
          style={{
            height: `${animatedValue}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  );
}

function CircularChartVisual({
  value,
  fillColor,
  animate,
}: {
  value: number;
  fillColor: string;
  animate: boolean;
}) {
  const clamped = clampChartValue(value);
  const { value: animatedValue } = useAnimatedPercentage(clamped, { animate });
  const displayValue = Math.round(animatedValue);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  return (
    <div className="relative mx-auto flex size-28 items-center justify-center">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={CHART_TRACK_COLOR}
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold tabular-nums text-slate-700">
        {displayValue}%
      </span>
    </div>
  );
}

function ChartLegend({
  item,
  variables = {},
}: {
  item: ChartItem;
  variables?: Record<string, unknown>;
}) {
  const html = resolveChartLegendHtml(item, variables);
  const plain = resolveChartLegendPlain(item, variables);

  if (html) {
    return (
      <div
        className="text-center text-sm leading-relaxed text-slate-500 [font-family:var(--quiz-font-body)] [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (!plain.trim()) return null;

  return (
    <p className="text-center text-sm leading-relaxed text-slate-500 [font-family:var(--quiz-font-body)]">
      {plain}
    </p>
  );
}

function ChartCard({
  item,
  design,
  disposition,
  variables,
  animate,
}: {
  item: ChartItem;
  design: QuizDesignSettings;
  disposition: ChartsDisposition;
  variables?: Record<string, unknown>;
  animate: boolean;
}) {
  const fillColor = resolveChartColor(item.color, design);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4",
        disposition === "legend_chart" && "flex-col-reverse",
      )}
    >
      <div className="flex shrink-0 items-center justify-center py-1">
        {item.chartType === "circular" ? (
          <CircularChartVisual
            value={item.value}
            fillColor={fillColor}
            animate={animate}
          />
        ) : (
          <BarChartVisual
            value={item.value}
            fillColor={fillColor}
            animate={animate}
          />
        )}
      </div>
      <ChartLegend item={item} variables={variables} />
    </div>
  );
}

export function ChartsWidgetRenderer({
  config,
  design,
  variables,
  animate = true,
  className,
}: ChartsWidgetRendererProps) {
  if (config.items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid w-full gap-3",
        getChartsGridClass(config.layout),
        className,
      )}
    >
      {config.items.map((item) => (
        <ChartCard
          key={item.id}
          item={item}
          design={design}
          disposition={config.disposition}
          variables={variables}
          animate={animate}
        />
      ))}
    </div>
  );
}
