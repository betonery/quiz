import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

type ToastState = {
  message: string | null;
  variant: ToastVariant;
  showToast: (message: string, variant?: ToastVariant) => void;
  clearToast: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: "info",
  showToast: (message, variant = "info") => set({ message, variant }),
  clearToast: () => set({ message: null }),
}));
