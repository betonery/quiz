import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger";
  footer?: ReactNode;
};

const TONES = {
  default: "text-slate-50",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-red-300",
} as const;

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  footer,
}: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          {label}
        </p>
        {Icon ? <Icon className="size-4 shrink-0 text-slate-600" /> : null}
      </div>

      <p className={cn("mt-2 text-2xl font-semibold", TONES[tone])}>{value}</p>

      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
