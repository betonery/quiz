import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import {
  AdminManualPaymentButton,
  AdminRefundButton,
} from "@/domains/admin/components/payments/admin-payment-actions";
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
import { PAYMENT_STATUS_LABELS } from "@/domains/admin/constants/admin.constants";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import {
  listPaymentProviders,
  listPayments,
} from "@/domains/admin/services/admin-payments.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import { listAllWorkspacesForSelect } from "@/domains/admin/services/admin-workspaces.service";
import {
  formatCents,
  formatDateTime,
} from "@/domains/admin/utils/admin-format.utils";
import { parseListParams } from "@/domains/admin/utils/admin-query.utils";

export const metadata = { title: "Pagamentos | Admin" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
    provider?: string;
  }>;
};

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const actor = await requireAdminAccess();
  const params = await searchParams;

  const [result, plans, workspaces, providers] = await Promise.all([
    listPayments({
      ...parseListParams(params),
      status: params.status,
      provider: params.provider,
    }),
    listAllPlans(),
    listAllWorkspacesForSelect(),
    listPaymentProviders(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Pagamentos"
        description={`${formatCents(result.totalCents)} recebidos no total.`}
        action={
          <AdminManualPaymentButton
            workspaces={workspaces}
            plans={plans}
            canWrite={actor.canWrite}
          />
        }
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <AdminFilterBar>
        <AdminSearchInput placeholder="Buscar por referência..." />
        <AdminFilterSelect
          paramKey="status"
          label="Status"
          allLabel="Todos os status"
          options={Object.entries(PAYMENT_STATUS_LABELS).map(
            ([value, label]) => ({ value, label }),
          )}
        />
        {providers.length > 1 ? (
          <AdminFilterSelect
            paramKey="provider"
            label="Origem"
            allLabel="Todas as origens"
            options={providers.map((provider) => ({
              value: provider,
              label: provider,
            }))}
          />
        ) : null}
      </AdminFilterBar>

      <AdminCard>
        {result.items.length === 0 ? (
          <AdminEmpty
            title="Nenhum pagamento encontrado"
            description="Lançamentos manuais e webhooks aparecem aqui."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Workspace</AdminTh>
                <AdminTh>Plano</AdminTh>
                <AdminTh className="text-right">Valor</AdminTh>
                <AdminTh>Método</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Data</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {result.items.map((payment) => (
                <AdminTr key={payment.id}>
                  <AdminTd>
                    {payment.workspaceName ? (
                      <Link
                        href={ROUTES.admin.workspace(payment.workspaceId)}
                        className="truncate font-medium text-slate-200 hover:text-cyan-300"
                      >
                        {payment.workspaceName}
                      </Link>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                    <p className="truncate text-xs text-slate-500">
                      {payment.externalPaymentId}
                    </p>
                  </AdminTd>

                  <AdminTd>{payment.planName}</AdminTd>

                  <AdminTd className="text-right tabular-nums">
                    {formatCents(payment.amountCents)}
                  </AdminTd>

                  <AdminTd>
                    <span className="text-xs text-slate-400">
                      {payment.paymentMethod}
                      <span className="text-slate-600">
                        {" "}
                        · {payment.provider}
                      </span>
                    </span>
                  </AdminTd>

                  <AdminTd>
                    <AdminBadge tone={statusTone(payment.status)}>
                      {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
                    </AdminBadge>
                  </AdminTd>

                  <AdminTd className="text-xs">
                    {formatDateTime(payment.createdAt)}
                  </AdminTd>

                  <AdminTd className="text-right">
                    <AdminRefundButton
                      payment={payment}
                      canWrite={actor.canWrite}
                    />
                  </AdminTd>
                </AdminTr>
              ))}
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
