"use client";

import { useMemo } from "react";
import { useBranding } from "@/providers/branding-provider";
import { resolveLandingContent } from "./landing-content";

export function useLandingContent() {
  const branding = useBranding();

  return useMemo(
    () =>
      resolveLandingContent(
        branding.productName,
        branding.landingHeadline,
        branding.landingSubheadline,
      ),
    [
      branding.productName,
      branding.landingHeadline,
      branding.landingSubheadline,
    ],
  );
}
