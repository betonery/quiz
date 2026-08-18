import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Superfície padrão dos blocos do painel. */
export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-slate-700/70 bg-slate-800/60 text-slate-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  accent: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
};

export function AdminBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string | null): BadgeTone {
  switch (status) {
    case "active":
    case "paid":
    case "published":
      return "success";
    case "past_due":
    case "draft":
      return "warning";
    case "canceled":
    case "failed":
      return "danger";
    case "refunded":
    case "archived":
      return "info";
    default:
      return "neutral";
  }
}

export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

/** Wrapper com rolagem horizontal — tabelas largas não estouram a página. */
export function AdminTableWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-slate-800/80 px-4 py-3 text-left text-xs font-medium tracking-wide text-slate-400 uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTd({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "border-b border-slate-800/50 px-4 py-3 align-middle text-slate-300",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function AdminTr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("transition-colors hover:bg-slate-800/30", className)}>
      {children}
    </tr>
  );
}

export function AdminDefinition({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{children}</dd>
    </div>
  );
}

export function AdminReadOnlyNotice() {
  return (
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      Seu perfil é <strong>Suporte</strong>: você enxerga todos os dados, mas as
      ações de alteração estão desabilitadas.
    </div>
  );
}
