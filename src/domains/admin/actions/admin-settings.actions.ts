"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { AUDIT_ACTIONS } from "@/domains/admin/constants/admin.constants";
import {
  maintenanceToggleSchema,
  platformSettingsSchema,
} from "@/domains/admin/schemas/admin-settings.schema";
import { recordAudit } from "@/domains/admin/services/admin-audit.service";
import { resolveAdminWriter } from "@/domains/admin/services/admin-guard.service";
import { planIdExists } from "@/domains/admin/services/admin-plans.service";
import {
  PLATFORM_SETTINGS_CACHE_TAG,
  setMaintenanceMode,
  updatePlatformSettings,
} from "@/domains/admin/services/admin-settings.service";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import {
  failure,
  invalidResult as invalid,
} from "@/domains/admin/utils/admin-action.utils";

function revalidateSettings() {
  revalidateTag(PLATFORM_SETTINGS_CACHE_TAG);
  revalidatePath(ROUTES.admin.settings);
  revalidatePath(ROUTES.admin.root);
  revalidatePath(ROUTES.register);
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.home);
}

export async function updatePlatformSettingsAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = platformSettingsSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  if (parsed.data.defaultPlanId) {
    const exists = await planIdExists(parsed.data.defaultPlanId);
    if (!exists) {
      return {
        success: false,
        error: "Plano padrão inexistente",
        fieldErrors: { defaultPlanId: ["Plano não encontrado"] },
      };
    }
  }

  const updated = await updatePlatformSettings(
    {
      maintenanceMode: parsed.data.maintenanceMode,
      maintenanceMessage: parsed.data.maintenanceMessage,
      signupsEnabled: parsed.data.signupsEnabled,
      signupsDisabledMessage: parsed.data.signupsDisabledMessage,
      globalAnnouncement: parsed.data.globalAnnouncement,
      defaultPlanId: parsed.data.defaultPlanId,
      trialDays: parsed.data.trialDays,
      supportEmail: parsed.data.supportEmail,
      productName: parsed.data.productName,
      productDescription: parsed.data.productDescription,
      logoUrl: parsed.data.logoUrl,
      faviconUrl: parsed.data.faviconUrl,
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      landingHeadline: parsed.data.landingHeadline,
      landingSubheadline: parsed.data.landingSubheadline,
    },
    actor.id,
  );

  if (!updated) return failure("Não foi possível salvar as configurações.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.settingsUpdated,
    entityType: "settings",
    entityId: "platform",
    summary: "Atualizou as configurações da plataforma",
    metadata: {
      maintenanceMode: parsed.data.maintenanceMode,
      signupsEnabled: parsed.data.signupsEnabled,
      trialDays: parsed.data.trialDays,
      defaultPlanId: parsed.data.defaultPlanId,
      productName: parsed.data.productName,
    },
  });

  revalidateSettings();
  return { success: true };
}

/** Atalho para o botão de manutenção — não exige preencher o formulário todo. */
export async function toggleMaintenanceModeAction(
  data: unknown,
): Promise<AdminActionResult> {
  const parsed = maintenanceToggleSchema.safeParse(data);
  if (!parsed.success) return invalid(parsed.error);

  const resolved = await resolveAdminWriter();
  if (!resolved.ok) return resolved.result;
  const { actor } = resolved;

  const updated = await setMaintenanceMode(parsed.data.enabled, actor.id);
  if (!updated) return failure("Não foi possível alterar o modo manutenção.");

  await recordAudit(actor, {
    action: AUDIT_ACTIONS.maintenanceToggled,
    entityType: "settings",
    entityId: "platform",
    summary: parsed.data.enabled
      ? "Ativou o modo manutenção"
      : "Desativou o modo manutenção",
    metadata: { enabled: parsed.data.enabled },
  });

  revalidateSettings();
  return { success: true };
}
