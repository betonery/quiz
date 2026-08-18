"use client";

import { Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type WidgetToolbarProps = {
  onDuplicate: () => void;
  onDelete: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
};

export function WidgetToolbar({
  onDuplicate,
  onDelete,
  dragHandleProps,
}: WidgetToolbarProps) {
  return (
    <div className="absolute -top-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-md">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 cursor-grab"
        aria-label="Mover widget"
        {...dragHandleProps}
      >
        <GripVertical className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Duplicar widget"
        onClick={onDuplicate}
      >
        <Copy className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-destructive"
        aria-label="Excluir widget"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
