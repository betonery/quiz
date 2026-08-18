import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { AdminCreateIntegrationButton } from "@/domains/admin/components/integrations/admin-create-integration-button";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminTableWrapper,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/domains/admin/components/ui/admin-primitives";
import { INTEGRATION_KIND_LABELS } from "@/domains/admin/constants/admin.constants";
import { requireAdminWriteAccess } from "@/domains/admin/services/admin-guard.service";
import { listIntegrations } from "@/domains/admin/services/admin-integrations.service";
import { formatRelativeTime } from "@/domains/admin/utils/admin-format.utils";
import {
  describeIntegrationStatus,
  INTEGRATION_STATUS_LABELS,
} from "@/domains/admin/utils/integration.utils";

export const metadata = { title: "Integrações | Admin" };

const STATUS_TONE = {
  awaiting_sample: "warning",
  needs_mapping: "warning",
  ready: "info",
  active: "success",
} as const;

export default async function AdminIntegrationsPage() {
  // Escrita apenas: a página expõe a URL do webhook e a senha padrão das
  // contas, que o papel `support` não deve alcançar.
  await requireAdminWriteAccess();

  const integrations = await listIntegrations();

  return (
    <>
      <AdminPageHeader
        title="Integrações"
        description="Receba eventos de compra e reembolso das plataformas de venda."
        action={<AdminCreateIntegrationButton />}
      />

      <AdminCard>
        {integrations.length === 0 ? (
          <AdminEmpty
            title="Nenhuma integração criada"
            description="Crie uma integração para receber a URL de webhook da plataforma."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Integração</AdminTh>
                <AdminTh>Tipo</AdminTh>
                <AdminTh>Estado</AdminTh>
                <AdminTh className="text-right">Eventos</AdminTh>
                <AdminTh>Último evento</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => {
                const status = describeIntegrationStatus(
                  integration,
                  integration.eventCount,
                );

                return (
                  <AdminTr key={integration.id}>
                    <AdminTd>
                      <p className="truncate font-medium text-slate-200">
                        {integration.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {integration.providerSlug}
                      </p>
                    </AdminTd>

                    <AdminTd>
                      <AdminBadge
                        tone={
                          integration.kind === "purchase" ? "accent" : "neutral"
                        }
                      >
                        {INTEGRATION_KIND_LABELS[integration.kind]}
                      </AdminBadge>
                    </AdminTd>

                    <AdminTd>
                      <AdminBadge tone={STATUS_TONE[status]}>
                        {INTEGRATION_STATUS_LABELS[status]}
                      </AdminBadge>
                    </AdminTd>

                    <AdminTd className="text-right tabular-nums">
                      <span>{integration.eventCount}</span>
                      {integration.failedCount > 0 ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-300">
                          <AlertTriangle className="size-3" />
                          {integration.failedCount}
                        </span>
                      ) : null}
                    </AdminTd>

                    <AdminTd className="text-xs">
                      {integration.lastEventAt
                        ? formatRelativeTime(integration.lastEventAt)
                        : "—"}
                    </AdminTd>

                    <AdminTd className="text-right">
                      <Link
                        href={ROUTES.admin.integration(integration.id)}
                        className="rounded-lg border border-slate-700/70 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        Configurar
                      </Link>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </tbody>
          </AdminTableWrapper>
        )}
      </AdminCard>
    </>
  );
}
