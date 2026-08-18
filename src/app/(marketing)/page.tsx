import type { Metadata } from "next";
import { BRANDING_DEFAULTS } from "@/config/branding.defaults";
import { getCachedPlatformBranding } from "@/domains/admin/services/admin-settings.service";
import { LandingPage } from "@/domains/marketing/components/landing/landing-page";
import { createClient } from "@/services/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  let name = BRANDING_DEFAULTS.productName;
  let description = BRANDING_DEFAULTS.productDescription;

  try {
    const branding = await getCachedPlatformBranding();
    name = branding.productName;
    description = branding.productDescription;
  } catch {
    // Ambiente sem service role.
  }

  return {
    title: `${name} — Quizzes inteligentes de alta conversão`,
    description,
  };
}

export default async function MarketingHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LandingPage isAuthenticated={Boolean(user)} />;
}
