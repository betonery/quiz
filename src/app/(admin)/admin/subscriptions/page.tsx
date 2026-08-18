import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { AdminExpireJobButton } from "@/domains/admin/components/subscriptions/admin-expire-job-button";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchInput,
} from "@/domains/admin/components/ui/admin-filters";
import { AdminPagination } from "@/domains/admin/components/ui/admin-pagination";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminReadOnlyNotice,
  AdminTableWrapper,
  AdminTd,
  AdminTh,
  AdminTr,
  statusTone,
} from "@/domains/admin/components/ui/admin-primitives";
import { SUBSCRIPTION_STATUS_LABELS } from "@/domains/admin/constants/admin.constants";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import { listSubscriptions } from "@/domains/admin/services/admin-subscriptions.service";
import {
  formatCents,
  formatShortDate,
} from "@/domains/admin/utils/admin-format.utils";
import { parseListParams } from "@/domains/admin/utils/admin-query.utils";

export const metadata = { title: "Assinaturas | Admin" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    planId?: string;
  }>;
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: PageProps) {
  const actor = await requireAdminAccess();
  const params = await searchParams;

  const [result, plans] = await Promise.all([
    listSubscriptions({
      ...parseListParams(params),
      status: params.status,
      planId: params.planId,
    }),
    listAllPlans(),
  ]);

  const now = Date.now();

  return (
    <>
      <AdminPageHeader
        title="Assinaturas"
        description={`${result.total} assinatura(s) registradas.`}
        action={<AdminExpireJobButton canWrite={actor.canWrite} />}
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <AdminFilterBar>
        <AdminSearchInput placeholder="Buscar por workspace ou e-mail..." />
        <AdminFilterSelect
          paramKey="status"
          label="Status"
          allLabel="Todos os status"
          options={Object.entries(SUBSCRIPTION_STATUS_LABELS).map(
            ([value, label]) => ({ value, label }),
          )}
        />
        <AdminFilterSelect
          paramKey="planId"
          label="Plano"
          allLabel="Todos os planos"
          options={plans.map((plan) => ({ value: plan.id, label: plan.name }))}
        />
      </AdminFilterBar>

      <AdminCard>
        {result.items.length === 0 ? (
          <AdminEmpty
            title="Nenhuma assinatura encontrada"
            description="Conceda uma assinatura pela página do workspace."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Workspace</AdminTh>
                <AdminTh>Plano</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="text-right">Valor</AdminTh>
                <AdminTh>Período</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {result.items.map((subscription) => {
                const expired =
                  subscription.currentPeriodEnd !== null &&
                  new Date(subscription.currentPeriodEnd).getTime() < now;

                return (
                  <AdminTr key={subscription.id}>
                    <AdminTd>
                      <p className="truncate font-medium text-slate-200">
                        {subscription.workspaceName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {subscription.ownerEmail ??
                          `/${subscription.workspaceSlug}`}
                      </p>
                    </AdminTd>

                    <AdminTd>{subscription.planName}</AdminTd>

                    <AdminTd>
                      <AdminBadge tone={statusTone(subscription.status)}>
                        {SUBSCRIPTION_STATUS_LABELS[subscription.status] ??
                          subscription.status}
                      </AdminBadge>
                    </AdminTd>

                    <AdminTd className="text-right tabular-nums">
                      {formatCents(subscription.priceCents)}
                    </AdminTd>

                    <AdminTd>
                      <span
                        className={
                          expired && subscription.status === "active"
                            ? "text-amber-300"
                            : undefined
                        }
                      >
                        até {formatShortDate(subscription.currentPeriodEnd)}
                      </span>
                    </AdminTd>

                    <AdminTd className="text-right">
                      <Link
                        href={ROUTES.admin.workspace(subscription.workspaceId)}
                        className="rounded-lg border border-slate-700/70 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        Gerenciar
                      </Link>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </tbody>
          </AdminTableWrapper>
        )}

        <AdminPagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          pageSize={result.pageSize}
        />
      </AdminCard>
    </>
  );
}
