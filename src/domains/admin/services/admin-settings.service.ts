import "server-only";

import { unstable_cache } from "next/cache";
import {
  BRANDING_DEFAULTS,
  type PlatformBranding,
} from "@/config/branding.defaults";
import type { AdminPlatformSettings } from "@/domains/admin/types/admin.types";
import { createAdminClient } from "@/services/supabase/admin";

export const PLATFORM_SETTINGS_CACHE_TAG = "platform-settings";

const DEFAULT_SETTINGS: AdminPlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage: "Estamos em manutenção. Voltamos em instantes.",
  signupsEnabled: true,
  signupsDisabledMessage: "Novos cadastros estão temporariamente desativados.",
  globalAnnouncement: null,
  defaultPlanId: null,
  trialDays: 0,
  supportEmail: null,
  productName: BRANDING_DEFAULTS.productName,
  productDescription: BRANDING_DEFAULTS.productDescription,
  logoUrl: BRANDING_DEFAULTS.logoUrl,
  faviconUrl: BRANDING_DEFAULTS.faviconUrl,
  primaryColor: BRANDING_DEFAULTS.primaryColor,
  secondaryColor: BRANDING_DEFAULTS.secondaryColor,
  landingHeadline: BRANDING_DEFAULTS.landingHeadline,
  landingSubheadline: BRANDING_DEFAULTS.landingSubheadline,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

function mapRow(data: Record<string, unknown>): AdminPlatformSettings {
  return {
    maintenanceMode: Boolean(data.maintenance_mode),
    maintenanceMessage: String(
      data.maintenance_message ?? DEFAULT_SETTINGS.maintenanceMessage,
    ),
    signupsEnabled: Boolean(data.signups_enabled ?? true),
    signupsDisabledMessage: String(
      data.signups_disabled_message ?? DEFAULT_SETTINGS.signupsDisabledMessage,
    ),
    globalAnnouncement: (data.global_announcement as string | null) ?? null,
    defaultPlanId: (data.default_plan_id as string | null) ?? null,
    trialDays: Number(data.trial_days ?? 0),
    supportEmail: (data.support_email as string | null) ?? null,
    productName: String(data.product_name ?? BRANDING_DEFAULTS.productName),
    productDescription: String(
      data.product_description ?? BRANDING_DEFAULTS.productDescription,
    ),
    logoUrl: (data.logo_url as string | null) ?? null,
    faviconUrl: (data.favicon_url as string | null) ?? null,
    primaryColor: String(data.primary_color ?? BRANDING_DEFAULTS.primaryColor),
    secondaryColor: String(
      data.secondary_color ?? BRANDING_DEFAULTS.secondaryColor,
    ),
    landingHeadline: String(
      data.landing_headline ?? BRANDING_DEFAULTS.landingHeadline,
    ),
    landingSubheadline: String(
      data.landing_subheadline ?? BRANDING_DEFAULTS.landingSubheadline,
    ),
    updatedAt: String(data.updated_at ?? DEFAULT_SETTINGS.updatedAt),
    updatedBy: (data.updated_by as string | null) ?? null,
  };
}

async function fetchSettings(): Promise<AdminPlatformSettings> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return DEFAULT_SETTINGS;

  return mapRow(data as Record<string, unknown>);
}

/** Leitura direta, sem cache — para o próprio painel. */
export async function getPlatformSettings(): Promise<AdminPlatformSettings> {
  return fetchSettings();
}

/**
 * Leitura cacheada para os caminhos quentes do app (cadastro, dashboard, landing).
 * Invalidada por `revalidateTag` sempre que o painel salva.
 */
export const getCachedPlatformSettings = unstable_cache(
  fetchSettings,
  ["platform-settings"],
  { tags: [PLATFORM_SETTINGS_CACHE_TAG], revalidate: 300 },
);

export function settingsToBranding(
  settings: AdminPlatformSettings,
): PlatformBranding {
  return {
    productName: settings.productName,
    productDescription: settings.productDescription,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    landingHeadline: settings.landingHeadline,
    landingSubheadline: settings.landingSubheadline,
  };
}

export async function getCachedPlatformBranding(): Promise<PlatformBranding> {
  const settings = await getCachedPlatformSettings();
  return settingsToBranding(settings);
}

export type PlatformSettingsInput = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  signupsEnabled: boolean;
  signupsDisabledMessage: string;
  globalAnnouncement: string | null;
  defaultPlanId: string | null;
  trialDays: number;
  supportEmail: string | null;
  productName: string;
  productDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  landingHeadline: string;
  landingSubheadline: string;
};

export async function updatePlatformSettings(
  input: PlatformSettingsInput,
  actorId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({
      maintenance_mode: input.maintenanceMode,
      maintenance_message: input.maintenanceMessage,
      signups_enabled: input.signupsEnabled,
      signups_disabled_message: input.signupsDisabledMessage,
      global_announcement: input.globalAnnouncement,
      default_plan_id: input.defaultPlanId,
      trial_days: input.trialDays,
      support_email: input.supportEmail,
      product_name: input.productName,
      product_description: input.productDescription,
      logo_url: input.logoUrl,
      favicon_url: input.faviconUrl,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      landing_headline: input.landingHeadline,
      landing_subheadline: input.landingSubheadline,
      updated_by: actorId,
    })
    .eq("id", 1);

  return !error;
}

export async function setMaintenanceMode(
  enabled: boolean,
  actorId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("platform_settings")
    .update({ maintenance_mode: enabled, updated_by: actorId })
    .eq("id", 1);

  return !error;
}
