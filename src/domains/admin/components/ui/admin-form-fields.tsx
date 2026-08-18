"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-slate-400 uppercase"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL_CLASS =
  "h-9 w-full rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input className={cn(CONTROL_CLASS, className)} {...props} />;
}

export function AdminTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(CONTROL_CLASS, "h-auto min-h-20 py-2", className)}
      {...props}
    />
  );
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select className={cn(CONTROL_CLASS, "pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function AdminSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "hover:border-slate-700",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-cyan-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-slate-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function AdminFormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}
