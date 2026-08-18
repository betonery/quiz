"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import type { RedirectWidgetConfig } from "@/domains/quiz/types/builder.types";
import { clampRedirectDelaySeconds } from "@/domains/quiz/utils/redirect-widget.utils";
import { cn } from "@/lib/utils";

type RedirectWidgetRendererProps = {
  config: RedirectWidgetConfig;
  mode?: "edit" | "preview" | "player";
  onTrigger?: () => void;
  className?: string;
};

export function RedirectWidgetRenderer({
  config,
  mode = "edit",
  onTrigger,
  className,
}: RedirectWidgetRendererProps) {
  const delaySeconds = clampRedirectDelaySeconds(config.delaySeconds);
  const hasTriggeredRef = useRef(false);
  const onTriggerRef = useRef(onTrigger);

  onTriggerRef.current = onTrigger;

  useEffect(() => {
    if (mode !== "player") return;

    hasTriggeredRef.current = false;
    const timeoutId = window.setTimeout(() => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      onTriggerRef.current?.();
    }, delaySeconds * 1000);

    return () => window.clearTimeout(timeoutId);
  }, [mode, delaySeconds]);

  if (mode === "player") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <ArrowRight className="size-4 shrink-0" />
      <span>Redirecionar · {delaySeconds}s</span>
    </div>
  );
}
