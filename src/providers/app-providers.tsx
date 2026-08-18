"use client";

import type { ReactNode } from "react";
import { AppToast } from "@/components/shared/app-toast";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        {children}
        <AppToast />
      </QueryProvider>
    </ThemeProvider>
  );
}
