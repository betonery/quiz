"use client";

import type { PlatformBranding } from "@/config/branding.defaults";
import { AppProviders } from "@/providers/app-providers";
import { BrandingProvider } from "@/providers/branding-provider";

export function Providers({
  children,
  branding,
}: {
  children: React.ReactNode;
  branding: PlatformBranding;
}) {
  return (
    <BrandingProvider branding={branding}>
      <AppProviders>{children}</AppProviders>
    </BrandingProvider>
  );
}
