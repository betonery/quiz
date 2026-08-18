import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AdminUserActions } from "@/domains/admin/components/users/admin-user-actions";
import { AdminUserPlanForm } from "@/domains/admin/components/users/admin-user-plan-form";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  AdminDefinition,
  AdminEmpty,
  AdminPageHeader,
  AdminReadOnlyNotice,
  statusTone,
} from "@/domains/admin/components/ui/admin-primitives";
import {
  AUDIT_ACTION_LABELS,
  PLATFORM_ROLE_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  WORKSPACE_ROLE_LABELS,
} from "@/domains/admin/constants/admin.constants";
import { listAuditForEntity } from "@/domains/admin/services/admin-audit.service";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import { getUserDetail } from "@/domains/admin/services/admin-users.service";
import {
  formatCents,
  formatDateTime,
  formatRelativeTime,
} from "@/domains/admin/utils/admin-format.utils";

export const metadata = { title: "Usuário | Admin" };

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminUserDetailPage({ params }: PageProps) {
  const actor = await requireAdminAccess();
  const { userId } = await params;

  const detail = await getUserDetail(userId);
  if (!detail) notFound();

  const [auditLogs, plans] = await Promise.all([
    listAuditForEntity("user", userId, 15),
    listAllPlans(),
  ]);
  const user = detail.user;

  return (
    <>
      <Link
        href={ROUTES.admin.users}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para usuários
      </Link>

      <AdminPageHeader
        title={user.fullName?.trim() || user.email}
        description={user.email}
        action={
          <div className="flex items-center gap-2">
            <AdminBadge
              tone={user.platformRole === "user" ? "neutral" : "accent"}
            >
              {PLATFORM_ROLE_LABELS[user.platformRole]}
            </AdminBadge>
            {user.suspendedAt ? (
              <AdminBadge tone="danger">Suspenso</AdminBadge>
            ) : (
              <AdminBadge tone="success">Ativo</AdminBadge>
            )}
          </div>
        }
      />

      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <AdminCard>
            <AdminCardHeader title="Conta" />
            <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminDefinition label="Cadastro">
                {formatDateTime(user.createdAt)}
              </AdminDefinition>
              <AdminDefinition label="Último acesso">
                {detail.auth?.lastSignInAt
                  ? formatRelativeTime(detail.auth.lastSignInAt)
                  : "Nunca"}
              </AdminDefinition>
              <AdminDefinition label="E-mail confirmado">
                {detail.auth?.emailConfirmedAt ? (
                  <AdminBadge tone="success">Confirmado</AdminBadge>
                ) : (
                  <AdminBadge tone="warning">Pendente</AdminBadge>
                )}
              </AdminDefinition>
              <AdminDefinition label="Provedor">
                {detail.auth?.provider ?? "—"}
              </AdminDefinition>
              <AdminDefinition label="Workspaces">
                {user.workspaceCount}
              </AdminDefinition>
              <AdminDefinition label="Funis criados">
                {user.quizCount}
              </AdminDefinition>
            </dl>

            {user.suspendedAt ? (
              <div className="mx-5 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                Suspenso em {formatDateTime(user.suspendedAt)}
                {user.suspendedReason ? ` — ${user.suspendedReason}` : ""}
              </div>
            ) : null}
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Workspaces"
              description="Organizações das quais este usuário participa."
            />
            {detail.workspaces.length === 0 ? (
              <AdminEmpty title="Nenhum workspace." />
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {detail.workspaces.map((workspace) => (
                  <li
                    key={workspace.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={ROUTES.admin.workspace(workspace.id)}
                        className="block truncate text-sm text-slate-200 hover:text-cyan-300"
                      >
                        {workspace.name}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        /{workspace.slug} · {workspace.quizCount} funil(is)
                      </p>
                    </div>

                    <AdminBadge tone={workspace.isOwner ? "accent" : "neutral"}>
                      {workspace.isOwner
                        ? "Proprietário"
                        : (WORKSPACE_ROLE_LABELS[workspace.role] ??
                          workspace.role)}
                    </AdminBadge>

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
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Pagamentos"
              description="Cobranças dos workspaces que este usuário possui."
            />
            {detail.payments.length === 0 ? (
              <AdminEmpty title="Nenhum pagamento registrado." />
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {detail.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">
                        {payment.planName} · {payment.workspaceName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(payment.createdAt)} ·{" "}
                        {payment.paymentMethod}
                      </p>
                    </div>
                    <AdminBadge tone={statusTone(payment.status)}>
                      {formatCents(payment.amountCents)}
                    </AdminBadge>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Histórico administrativo"
              description="Ações do painel que envolveram este usuário."
            />
            {auditLogs.length === 0 ? (
              <AdminEmpty title="Nenhuma ação registrada." />
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {auditLogs.map((log) => (
                  <li key={log.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <AdminBadge>
                        {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                      </AdminBadge>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-300">
                      {log.summary}
                    </p>
                    <p className="text-xs text-slate-600">
                      por {log.actorEmail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <div className="flex flex-col gap-4">
          <AdminUserPlanForm
            workspaces={detail.workspaces}
            plans={plans}
            canWrite={actor.canWrite}
          />

          <AdminUserActions
            detail={detail}
            canWrite={actor.canWrite}
            isSelf={actor.id === user.id}
          />
        </div>
      </div>
    </>
  );
}
