import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AdminIntegrationEvents } from "@/domains/admin/components/integrations/admin-integration-events";
import { AdminMappingForm } from "@/domains/admin/components/integrations/admin-mapping-form";
import { AdminWebhookUrlCard } from "@/domains/admin/components/integrations/admin-webhook-url-card";
import {
  AdminBadge,
  AdminPageHeader,
} from "@/domains/admin/components/ui/admin-primitives";
import { INTEGRATION_KIND_LABELS } from "@/domains/admin/constants/admin.constants";
import { requireAdminWriteAccess } from "@/domains/admin/services/admin-guard.service";
import { getIntegrationDetail } from "@/domains/admin/services/admin-integrations.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import {
  describeIntegrationStatus,
  INTEGRATION_STATUS_LABELS,
} from "@/domains/admin/utils/integration.utils";

export const metadata = { title: "Integração | Admin" };

const STATUS_TONE = {
  awaiting_sample: "warning",
  needs_mapping: "warning",
  ready: "info",
  active: "success",
} as const;

type PageProps = { params: Promise<{ integrationId: string }> };

export default async function AdminIntegrationDetailPage({
  params,
}: PageProps) {
  await requireAdminWriteAccess();
  const { integrationId } = await params;

  // A URL do webhook vive no domínio do Supabase, onde a Edge Function roda.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const [detail, plans] = await Promise.all([
    getIntegrationDetail(integrationId, supabaseUrl),
    listAllPlans(),
  ]);

  if (!detail) notFound();

  const { integration, events, webhookUrl } = detail;
  const status = describeIntegrationStatus(integration, events.length);

  return (
    <>
      <Link
        href={ROUTES.admin.integrations}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para integrações
      </Link>

      <AdminPageHeader
        title={integration.name}
        description={`${INTEGRATION_KIND_LABELS[integration.kind]} · ${integration.providerSlug}`}
        action={
          <AdminBadge tone={STATUS_TONE[status]}>
            {INTEGRATION_STATUS_LABELS[status]}
          </AdminBadge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-4">
          <AdminWebhookUrlCard
            integrationId={integration.id}
            integrationName={integration.name}
            webhookUrl={webhookUrl}
            eventCount={events.length}
          />

          <AdminIntegrationEvents events={events} />
        </div>

        <AdminMappingForm
          integration={integration}
          events={events}
          plans={plans.filter((plan) => plan.isActive)}
        />
      </div>
    </>
  );
}
