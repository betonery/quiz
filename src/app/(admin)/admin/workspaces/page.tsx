import Link from "next/link";
import { ROUTES } from "@/constants/routes";
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
import { listWorkspaces } from "@/domains/admin/services/admin-workspaces.service";
import {
  formatRelativeTime,
  formatShortDate,
} from "@/domains/admin/utils/admin-format.utils";
import { parseListParams } from "@/domains/admin/utils/admin-query.utils";

export const metadata = { title: "Workspaces | Admin" };

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
};

export default async function AdminWorkspacesPage({ searchParams }: PageProps) {
  const actor = await requireAdminAccess();
  const params = await searchParams;

  const result = await listWorkspaces({
    ...parseListParams(params),
    status: params.status,
  });

  return (
    <>
      <AdminPageHeader
        title="Workspaces"
        description={`${result.total} organização(ões) na plataforma.`}
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <AdminFilterBar>
        <AdminSearchInput placeholder="Buscar por nome ou slug..." />
        <AdminFilterSelect
          paramKey="status"
          label="Assinatura"
          allLabel="Todas as assinaturas"
          options={[
            { value: "active", label: "Ativa" },
            { value: "past_due", label: "Em atraso" },
            { value: "canceled", label: "Cancelada" },
            { value: "inactive", label: "Inativa" },
            { value: "none", label: "Sem assinatura" },
          ]}
        />
      </AdminFilterBar>

      <AdminCard>
        {result.items.length === 0 ? (
          <AdminEmpty
            title="Nenhum workspace encontrado"
            description="Ajuste a busca ou os filtros."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Workspace</AdminTh>
                <AdminTh>Proprietário</AdminTh>
                <AdminTh>Assinatura</AdminTh>
                <AdminTh className="text-right">Membros</AdminTh>
                <AdminTh className="text-right">Funis</AdminTh>
                <AdminTh>Criado</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {result.items.map((workspace) => (
                <AdminTr key={workspace.id}>
                  <AdminTd>
                    <p className="truncate font-medium text-slate-200">
                      {workspace.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      /{workspace.slug}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <p className="truncate text-sm text-slate-300">
                      {workspace.ownerName?.trim() || "—"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {workspace.ownerEmail ?? "—"}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    {workspace.subscriptionStatus ? (
                      <AdminBadge
                        tone={statusTone(workspace.subscriptionStatus)}
                      >
                        {workspace.planName} ·{" "}
                        {SUBSCRIPTION_STATUS_LABELS[
                          workspace.subscriptionStatus
                        ] ?? workspace.subscriptionStatus}
                      </AdminBadge>
                    ) : (
                      <AdminBadge tone="neutral">Sem assinatura</AdminBadge>
                    )}
                  </AdminTd>

                  <AdminTd className="text-right tabular-nums">
                    {workspace.memberCount}
                  </AdminTd>
                  <AdminTd className="text-right tabular-nums">
                    {workspace.quizCount}
                    <span className="text-slate-600">
                      {" "}
                      ({workspace.publishedQuizCount} pub.)
                    </span>
                  </AdminTd>

                  <AdminTd>
                    <span title={formatShortDate(workspace.createdAt)}>
                      {formatRelativeTime(workspace.createdAt)}
                    </span>
                  </AdminTd>

                  <AdminTd className="text-right">
                    <Link
                      href={ROUTES.admin.workspace(workspace.id)}
                      className="rounded-lg border border-slate-700/70 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                    >
                      Gerenciar
                    </Link>
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
