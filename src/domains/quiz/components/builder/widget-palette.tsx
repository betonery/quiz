"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Type,
  MousePointerClick,
  TextCursorInput,
  ListChecks,
  Gauge,
  Loader2,
  ArrowRight,
  BarChart3,
  HelpCircle,
  SeparatorHorizontal,
  ShieldCheck,
  Tags,
  Timer,
  MessageCircle,
  Megaphone,
  Sparkles,
  SplitSquareHorizontal,
  Table,
  Building2,
  Star,
  Frame,
  Code2,
} from "lucide-react";
import { WIDGET_PALETTE } from "@/domains/quiz/registry/widget-registry";
import type { WidgetType } from "@/domains/quiz/types/builder.types";
import { cn } from "@/lib/utils";

const ICONS: Partial<
  Record<WidgetType, React.ComponentType<{ className?: string }>>
> = {
  text: Type,
  button: MousePointerClick,
  input: TextCursorInput,
  options: ListChecks,
  level: Gauge,
  loading: Loader2,
  redirect: ArrowRight,
  charts: BarChart3,
  faq: HelpCircle,
  benefits: ListChecks,
  spacer: SeparatorHorizontal,
  "trust-badge": ShieldCheck,
  whatsapp: MessageCircle,
  pricing: Tags,
  countdown: Timer,
  "result-block": Sparkles,
  "before-after": SplitSquareHorizontal,
  "comparison-table": Table,
  "logo-bar": Building2,
  alert: Megaphone,
  rating: Star,
  embed: Frame,
  script: Code2,
};

function DraggablePaletteItem({
  type,
  label,
}: {
  type: WidgetType;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette::${type}`,
      data: { type, source: "palette" },
    });

  const Icon = ICONS[type];

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted",
        isDragging && "opacity-50",
      )}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
    >
      {Icon && <Icon className="size-4 text-muted-foreground" />}
      <span>{label}</span>
    </button>
  );
}

export function WidgetPalette() {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-3 py-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Widgets
        </p>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {WIDGET_PALETTE.map((item) => (
          <DraggablePaletteItem
            key={item.label}
            type={item.type}
            label={item.label}
          />
        ))}
      </div>
    </aside>
  );
}
