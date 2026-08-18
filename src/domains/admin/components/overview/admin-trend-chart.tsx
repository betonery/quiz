import type { AdminTrendPoint } from "@/domains/admin/types/admin.types";

/**
 * Cadastros e funis por dia — duas séries de contagem no MESMO eixo.
 * Cores: slots categóricos 1 e 2 da paleta escura (ΔE CVD 26.8, contraste ≥3:1).
 */
const SERIES = {
  users: { color: "#3987e5", label: "Novos usuários" },
  quizzes: { color: "#d95926", label: "Funis criados" },
} as const;

function formatDayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function AdminTrendChart({ data }: { data: AdminTrendPoint[] }) {
  const max = Math.max(...data.flatMap((d) => [d.users, d.quizzes]), 1);
  const hasData = data.some((point) => point.users > 0 || point.quizzes > 0);

  return (
    <div className="px-5 py-4">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {Object.values(SERIES).map((series) => (
          <span
            key={series.label}
            className="flex items-center gap-1.5 text-xs text-slate-400"
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          Pico diário: <span className="text-slate-300">{max}</span>
        </span>
      </div>

      {hasData ? (
        <div
          className="flex h-40 items-end gap-[3px]"
          role="img"
          aria-label="Novos usuários e funis criados por dia nos últimos 30 dias"
        >
          {data.map((point) => (
            <div
              key={point.date}
              className="group relative flex h-full flex-1 items-end justify-center gap-[2px]"
            >
              <Bar value={point.users} max={max} color={SERIES.users.color} />
              <Bar
                value={point.quizzes}
                max={max}
                color={SERIES.quizzes.color}
              />

              {/* Tooltip por marca, sem JS: aparece no hover do grupo. */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg group-hover:block">
                <p className="font-medium text-slate-200">
                  {formatDayLabel(point.date)}
                </p>
                <p className="text-slate-400">
                  {point.users} usuário(s) · {point.quizzes} funil(is)
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center text-xs text-slate-600">
          Sem registros nos últimos 30 dias.
        </div>
      )}

      <div className="mt-2 flex justify-between text-[11px] text-slate-600">
        <span>{data[0] ? formatDayLabel(data[0].date) : ""}</span>
        <span>
          {data[data.length - 1]
            ? formatDayLabel(data[data.length - 1].date)
            : ""}
        </span>
      </div>
    </div>
  );
}

function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  // Barras com valor 0 mantêm 2px visíveis para preservar o ritmo do eixo.
  const heightPercent = value === 0 ? 0 : Math.max((value / max) * 100, 4);

  return (
    <div
      className="w-full min-w-[2px] rounded-t-[4px] transition-opacity group-hover:opacity-100"
      style={{
        height: `${heightPercent}%`,
        backgroundColor: color,
        minHeight: value === 0 ? "2px" : undefined,
        opacity: value === 0 ? 0.25 : 0.9,
      }}
    />
  );
}
