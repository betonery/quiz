import { useMemo } from "react";
import { useToastStore, type ToastVariant } from "@/stores/toast.store";

export function useToast() {
  const showToast = useToastStore((state) => state.showToast);

  return useMemo(
    () => ({
      toast: showToast,
      success: (message: string) => showToast(message, "success"),
      error: (message: string) => showToast(message, "error"),
      info: (message: string) => showToast(message, "info"),
      show: (message: string, variant: ToastVariant = "info") =>
        showToast(message, variant),
    }),
    [showToast],
  );
}
