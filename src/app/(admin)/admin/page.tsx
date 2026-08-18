import { AdminOverview } from "@/domains/admin/components/overview/admin-overview";
import {
  AdminPageHeader,
  AdminReadOnlyNotice,
} from "@/domains/admin/components/ui/admin-primitives";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { getOverviewMetrics } from "@/domains/admin/services/admin-metrics.service";

export const metadata = { title: "Visão geral | Admin" };

export default async function AdminOverviewPage() {
  const actor = await requireAdminAccess();
  const metrics = await getOverviewMetrics();

  return (
    <>
      <AdminPageHeader
        title="Visão geral"
        description="Saúde da plataforma em números."
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}
      <AdminOverview metrics={metrics} />
    </>
  );
}
