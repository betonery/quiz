"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldWrapperProps = {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function FormFieldWrapper({
  label,
  error,
  children,
  className,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
