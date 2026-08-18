"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FlowNodeToolbarProps = {
  children: ReactNode;
  visible?: boolean;
  className?: string;
};

export function FlowNodeToolbar({
  children,
  visible = false,
  className,
}: FlowNodeToolbarProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute -top-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-background px-1 py-1 shadow-md transition-opacity",
        visible
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

type FlowNodeToolbarButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  variant?: "default" | "destructive";
  disabled?: boolean;
};

export function FlowNodeToolbarButton({
  label,
  onClick,
  children,
  variant = "default",
  disabled = false,
}: FlowNodeToolbarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex size-7 items-center justify-center rounded-md text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40",
        variant === "destructive"
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-muted hover:text-foreground",
      )}
      aria-label={label}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
