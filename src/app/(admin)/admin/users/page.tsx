import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchInput,
} from "@/domains/admin/components/ui/admin-filters";
import { AdminPagination } from "@/domains/admin/components/ui/admin-pagination";
import {
  AdminCard,
  AdminPageHeader,
  AdminReadOnlyNotice,
} from "@/domains/admin/components/ui/admin-primitives";
import { AdminCreateUserButton } from "@/domains/admin/components/users/admin-create-user-button";
import { AdminUsersTable } from "@/domains/admin/components/users/admin-users-table";
import {
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_OPTIONS,
} from "@/domains/admin/constants/admin.constants";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import { listUsers } from "@/domains/admin/services/admin-users.service";
import { parseListParams } from "@/domains/admin/utils/admin-query.utils";

export const metadata = { title: "Usuários | Admin" };

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    role?: string;
    status?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const actor = await requireAdminAccess();
  const params = await searchParams;
  const listParams = parseListParams(params);

  const [result, plans] = await Promise.all([
    listUsers({
      ...listParams,
      role: params.role,
      status:
        params.status === "suspended" || params.status === "active"
          ? params.status
          : undefined,
    }),
    listAllPlans(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Usuários"
        description={`${result.total} conta(s) na plataforma.`}
        action={
          <AdminCreateUserButton
            plans={plans.filter((plan) => plan.isActive)}
            canWrite={actor.canWrite}
          />
        }
      />
      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <AdminFilterBar>
        <AdminSearchInput placeholder="Buscar por nome ou e-mail..." />
        <AdminFilterSelect
          paramKey="role"
          label="Papel"
          allLabel="Todos os papéis"
          options={PLATFORM_ROLE_OPTIONS.map((role) => ({
            value: role,
            label: PLATFORM_ROLE_LABELS[role],
          }))}
        />
        <AdminFilterSelect
          paramKey="status"
          label="Situação"
          allLabel="Todas as situações"
          options={[
            { value: "active", label: "Ativos" },
            { value: "suspended", label: "Suspensos" },
          ]}
        />
      </AdminFilterBar>

      <AdminCard>
        <AdminUsersTable users={result.items} />
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
