"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToastStore, type ToastVariant } from "@/stores/toast.store";

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    label: string;
    accent: string;
    progress: string;
    icon: typeof Info;
    iconClass: string;
    iconBg: string;
    ring: string;
  }
> = {
  success: {
    label: "Sucesso",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    progress: "bg-emerald-400",
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
    iconBg: "bg-emerald-500/15 ring-emerald-500/25",
    ring: "ring-emerald-500/20",
  },
  error: {
    label: "Erro",
    accent: "from-red-500/20 via-red-500/5 to-transparent",
    progress: "bg-red-400",
    icon: AlertCircle,
    iconClass: "text-red-300",
    iconBg: "bg-red-500/15 ring-red-500/25",
    ring: "ring-red-500/20",
  },
  info: {
    label: "Informação",
    accent: "from-sky-500/15 via-sky-500/5 to-transparent",
    progress: "bg-sky-400",
    icon: Info,
    iconClass: "text-sky-200",
    iconBg: "bg-sky-500/15 ring-sky-500/25",
    ring: "ring-sky-500/15",
  },
};

const DISMISS_MS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6500,
  info: 4000,
};

const EXIT_MS = 320;

type ToastContent = {
  message: string;
  variant: ToastVariant;
  key: number;
};

export function AppToast() {
  const message = useToastStore((state) => state.message);
  const variant = useToastStore((state) => state.variant);
  const clearToast = useToastStore((state) => state.clearToast);

  const [toast, setToast] = useState<ToastContent | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissAtRef = useRef(0);
  const remainingMsRef = useRef(0);
  const toastKeyRef = useRef(0);
  const isClosingRef = useRef(false);
  const toastRef = useRef<ToastContent | null>(null);

  toastRef.current = toast;

  function clearDismissTimer() {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }

  function clearExitTimer() {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }

  function clearAllTimers() {
    clearDismissTimer();
    clearExitTimer();
  }

  function removeToastFromScreen() {
    isClosingRef.current = false;
    setToast(null);
    setIsExiting(false);
    setIsPaused(false);
    clearToast();
  }

  function beginClose() {
    if (isClosingRef.current || !toastRef.current) return;

    isClosingRef.current = true;
    clearDismissTimer();
    clearExitTimer();
    setIsPaused(false);
    setIsExiting(true);

    exitTimerRef.current = setTimeout(() => {
      removeToastFromScreen();
    }, EXIT_MS);
  }

  function armAutoDismiss(durationMs: number) {
    clearDismissTimer();

    if (durationMs <= 0) {
      beginClose();
      return;
    }

    remainingMsRef.current = durationMs;
    dismissAtRef.current = Date.now() + durationMs;

    dismissTimerRef.current = setTimeout(() => {
      beginClose();
    }, durationMs);
  }

  function showToast(nextMessage: string, nextVariant: ToastVariant) {
    isClosingRef.current = false;
    clearAllTimers();

    toastKeyRef.current += 1;
    const nextToast: ToastContent = {
      message: nextMessage,
      variant: nextVariant,
      key: toastKeyRef.current,
    };

    setToast(nextToast);
    setIsExiting(false);
    setIsPaused(false);
    armAutoDismiss(DISMISS_MS[nextVariant]);
  }

  useEffect(() => {
    if (!message) return;

    showToast(message, variant);
    clearToast();
  }, [message, variant, clearToast]);

  useEffect(() => () => clearAllTimers(), []);

  if (!toast) return null;

  const styles = VARIANT_STYLES[toast.variant];
  const Icon = styles.icon;
  const durationMs = DISMISS_MS[toast.variant];

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-5 left-5 z-[120] w-[min(100vw-2.5rem,22rem)] overflow-hidden rounded-2xl border border-white/8 bg-slate-950/92 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.65)] ring-1 backdrop-blur-md",
        styles.ring,
        isExiting ? "builder-toast-exit" : "builder-toast-enter",
      )}
      role="status"
      aria-live="polite"
      onMouseEnter={() => {
        if (isClosingRef.current || !toast) return;

        const remaining = Math.max(dismissAtRef.current - Date.now(), 0);
        remainingMsRef.current = remaining;
        clearDismissTimer();
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        if (isClosingRef.current || !toast) return;

        setIsPaused(false);
        armAutoDismiss(remainingMsRef.current);
      }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          styles.accent,
        )}
        aria-hidden
      />

      <div className="relative flex items-start gap-3 px-4 pt-3.5 pb-3">
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ring-1",
            styles.iconBg,
          )}
        >
          <Icon className={cn("size-4", styles.iconClass)} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {styles.label}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-100">
            {toast.message}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-slate-500 hover:bg-white/6 hover:text-slate-100"
          onClick={beginClose}
          aria-label="Fechar notificação"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="relative h-1 bg-white/6">
        <div
          key={toast.key}
          className={cn(
            "builder-toast-progress h-full rounded-r-full",
            styles.progress,
            isPaused && "builder-toast-progress-paused",
          )}
          style={
            { "--toast-duration": `${durationMs}ms` } as React.CSSProperties
          }
        />
      </div>
    </div>
  );
}
