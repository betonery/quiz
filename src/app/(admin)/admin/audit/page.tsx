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
  AdminTableWrapper,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/domains/admin/components/ui/admin-primitives";
import { AUDIT_ACTION_LABELS } from "@/domains/admin/constants/admin.constants";
import {
  listAuditLogs,
  listDistinctAuditActions,
} from "@/domains/admin/services/admin-audit.service";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { formatDateTime } from "@/domains/admin/utils/admin-format.utils";
import { parseListParams } from "@/domains/admin/utils/admin-query.utils";

export const metadata = { title: "Auditoria | Admin" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    action?: string;
    entityType?: string;
  }>;
};

export default async function AdminAuditPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;

  const [result, actions] = await Promise.all([
    listAuditLogs({
      ...parseListParams(params),
      action: params.action,
      entityType: params.entityType,
    }),
    listDistinctAuditActions(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Auditoria"
        description="Registro imutável de toda alteração feita pelo painel."
      />

      <AdminFilterBar>
        <AdminSearchInput placeholder="Buscar por autor, resumo ou entidade..." />
        <AdminFilterSelect
          paramKey="action"
          label="Ação"
          allLabel="Todas as ações"
          options={actions.map((action) => ({
            value: action,
            label: AUDIT_ACTION_LABELS[action] ?? action,
          }))}
        />
        <AdminFilterSelect
          paramKey="entityType"
          label="Entidade"
          allLabel="Todas as entidades"
          options={[
            { value: "user", label: "Usuário" },
            { value: "workspace", label: "Workspace" },
            { value: "plan", label: "Plano" },
            { value: "subscription", label: "Assinatura" },
            { value: "payment", label: "Pagamento" },
            { value: "quiz", label: "Funil" },
            { value: "settings", label: "Configurações" },
            { value: "job", label: "Rotina" },
          ]}
        />
      </AdminFilterBar>

      <AdminCard>
        {result.items.length === 0 ? (
          <AdminEmpty
            title="Nenhum registro"
            description="As ações feitas no painel administrativo aparecem aqui."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Data</AdminTh>
                <AdminTh>Autor</AdminTh>
                <AdminTh>Ação</AdminTh>
                <AdminTh>Resumo</AdminTh>
              </tr>
            </thead>
            <tbody>
              {result.items.map((log) => (
                <AdminTr key={log.id}>
                  <AdminTd className="text-xs whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </AdminTd>
                  <AdminTd className="text-xs">{log.actorEmail}</AdminTd>
                  <AdminTd>
                    <AdminBadge>
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </AdminBadge>
                  </AdminTd>
                  <AdminTd>
                    <p className="text-sm text-slate-300">{log.summary}</p>
                    {log.entityLabel ? (
                      <p className="text-xs text-slate-600">
                        {log.entityType} · {log.entityLabel}
                      </p>
                    ) : null}
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
