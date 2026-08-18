import { AdminSettingsForm } from "@/domains/admin/components/settings/admin-settings-form";
import {
  AdminPageHeader,
  AdminReadOnlyNotice,
} from "@/domains/admin/components/ui/admin-primitives";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import { getPlatformSettings } from "@/domains/admin/services/admin-settings.service";
import { formatDateTime } from "@/domains/admin/utils/admin-format.utils";

export const metadata = { title: "Configurações | Admin" };

export default async function AdminSettingsPage() {
  const actor = await requireAdminAccess();
  const [settings, plans] = await Promise.all([
    getPlatformSettings(),
    listAllPlans(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Configurações da plataforma"
        description={`Última alteração em ${formatDateTime(settings.updatedAt)}.`}
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <AdminSettingsForm
        settings={settings}
        plans={plans.filter((plan) => plan.isActive)}
        canWrite={actor.canWrite}
      />
    </>
  );
}
