import { AdminPlansManager } from "@/domains/admin/components/plans/admin-plans-manager";
import {
  AdminPageHeader,
  AdminReadOnlyNotice,
} from "@/domains/admin/components/ui/admin-primitives";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";

export const metadata = { title: "Planos | Admin" };

export default async function AdminPlansPage() {
  const actor = await requireAdminAccess();
  const plans = await listAllPlans();

  return (
    <>
      <AdminPageHeader
        title="Planos"
        description="Preços e limites aplicados a cada assinatura."
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}
      <AdminPlansManager plans={plans} canWrite={actor.canWrite} />
    </>
  );
}
