import type { ReactNode } from "react";
import type { WidgetLayoutFields } from "@/domains/quiz/types/builder.types";
import { cn } from "@/lib/utils";

type WidgetLayoutProps = {
  layout: WidgetLayoutFields;
  children: ReactNode;
  className?: string;
};

const alignClassMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
} as const;

export function WidgetLayout({
  layout,
  children,
  className,
}: WidgetLayoutProps) {
  const maxWidth = layout.maxWidth ?? 100;
  const horizontalAlign = layout.horizontalAlign ?? "start";

  return (
    <div
      className={cn("flex w-full", alignClassMap[horizontalAlign], className)}
    >
      <div className="min-w-0" style={{ width: `${maxWidth}%` }}>
        {children}
      </div>
    </div>
  );
}
