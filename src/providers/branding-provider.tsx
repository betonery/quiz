"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  BRANDING_DEFAULTS,
  type PlatformBranding,
} from "@/config/branding.defaults";

const BrandingContext = createContext<PlatformBranding>(BRANDING_DEFAULTS);

export function BrandingProvider({
  branding,
  children,
}: {
  branding: PlatformBranding;
  children: ReactNode;
}) {
  const css = `:root {
  --brand-primary: ${branding.primaryColor};
  --brand-secondary: ${branding.secondaryColor};
  --primary-900: ${branding.primaryColor};
  --secondary-500: ${branding.secondaryColor};
}`;

  return (
    <BrandingContext.Provider value={branding}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): PlatformBranding {
  return useContext(BrandingContext);
}
