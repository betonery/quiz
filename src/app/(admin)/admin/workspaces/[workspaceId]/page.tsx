import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AdminMemberRemoveButton } from "@/domains/admin/components/workspaces/admin-member-remove-button";
import {
  AdminMemberRoleControl,
  AdminWorkspaceActions,
} from "@/domains/admin/components/workspaces/admin-workspace-actions";
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
  QUIZ_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  WORKSPACE_ROLE_LABELS,
} from "@/domains/admin/constants/admin.constants";
import { listAuditForEntity } from "@/domains/admin/services/admin-audit.service";
import { requireAdminAccess } from "@/domains/admin/services/admin-guard.service";
import { listAllPlans } from "@/domains/admin/services/admin-plans.service";
import { getSubscriptionForWorkspace } from "@/domains/admin/services/admin-subscriptions.service";
import { getWorkspaceDetail } from "@/domains/admin/services/admin-workspaces.service";
import {
  formatCents,
  formatDateTime,
  formatShortDate,
} from "@/domains/admin/utils/admin-format.utils";

export const metadata = { title: "Workspace | Admin" };

type PageProps = { params: Promise<{ workspaceId: string }> };

export default async function AdminWorkspaceDetailPage({ params }: PageProps) {
  const actor = await requireAdminAccess();
  const { workspaceId } = await params;

  const detail = await getWorkspaceDetail(workspaceId);
  if (!detail) notFound();

  const [subscription, plans, auditLogs] = await Promise.all([
    getSubscriptionForWorkspace(workspaceId),
    listAllPlans(),
    listAuditForEntity("workspace", workspaceId, 15),
  ]);

  const workspace = detail.workspace;

  return (
    <>
      <Link
        href={ROUTES.admin.workspaces}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para workspaces
      </Link>

      <AdminPageHeader
        title={workspace.name}
        description={`/${workspace.slug}`}
        action={
          workspace.subscriptionStatus ? (
            <AdminBadge tone={statusTone(workspace.subscriptionStatus)}>
              {workspace.planName} ·{" "}
              {SUBSCRIPTION_STATUS_LABELS[workspace.subscriptionStatus] ??
                workspace.subscriptionStatus}
            </AdminBadge>
          ) : (
            <AdminBadge tone="neutral">Sem assinatura</AdminBadge>
          )
        }
      />

      {actor.canWrite ? null : <AdminReadOnlyNotice />}

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <AdminCard>
            <AdminCardHeader title="Resumo" />
            <dl className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminDefinition label="Proprietário">
                <Link
                  href={ROUTES.admin.user(workspace.ownerId)}
                  className="hover:text-cyan-300"
                >
                  {workspace.ownerEmail ?? "—"}
                </Link>
              </AdminDefinition>
              <AdminDefinition label="Criado em">
                {formatShortDate(workspace.createdAt)}
              </AdminDefinition>
              <AdminDefinition label="Membros">
                {workspace.memberCount}
              </AdminDefinition>
              <AdminDefinition label="Funis">
                {workspace.quizCount} ({workspace.publishedQuizCount}{" "}
                publicados)
              </AdminDefinition>
              <AdminDefinition label="Domínios personalizados">
                {detail.customDomainCount}
              </AdminDefinition>
              <AdminDefinition label="Fim do período">
                {formatShortDate(workspace.currentPeriodEnd)}
              </AdminDefinition>
            </dl>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Membros"
              description={`${detail.members.length} pessoa(s) com acesso.`}
            />
            {detail.members.length === 0 ? (
              <AdminEmpty title="Nenhum membro." />
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {detail.members.map((member) => {
                  const isOwner = member.userId === workspace.ownerId;

                  return (
                    <li
                      key={member.userId}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={ROUTES.admin.user(member.userId)}
                          className="block truncate text-sm text-slate-200 hover:text-cyan-300"
                        >
                          {member.fullName?.trim() || member.email}
                        </Link>
                        <p className="truncate text-xs text-slate-500">
                          {member.email} · entrou em{" "}
                          {formatShortDate(member.joinedAt)}
                        </p>
                      </div>

                      {isOwner ? (
                        <AdminBadge tone="accent">
                          {WORKSPACE_ROLE_LABELS.owner}
                        </AdminBadge>
                      ) : (
                        <AdminMemberRoleControl
                          workspaceId={workspace.id}
                          userId={member.userId}
                          role={member.role}
                          isOwner={isOwner}
                          canWrite={actor.canWrite}
                        />
                      )}

                      <AdminMemberRemoveButton
                        workspaceId={workspace.id}
                        userId={member.userId}
                        email={member.email}
                        disabled={!actor.canWrite || isOwner}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <AdminCardHeader
              title="Funis"
              description="50 mais recentes deste workspace."
            />
            {detail.quizzes.length === 0 ? (
              <AdminEmpty title="Nenhum funil criado." />
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {detail.quizzes.map((quiz) => (
                  <li
                    key={quiz.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">
                        {quiz.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        /q/{quiz.slug} · atualizado em{" "}
                        {formatShortDate(quiz.updatedAt)}
                      </p>
                    </div>

                    <AdminBadge tone={statusTone(quiz.status)}>
                      {QUIZ_STATUS_LABELS[quiz.status] ?? quiz.status}
                    </AdminBadge>

                    {quiz.status === "published" ? (
                      <a
                        href={ROUTES.publicQuiz(quiz.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
                        aria-label={`Abrir ${quiz.title}`}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Pagamentos" />
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
                        {payment.planName} · {payment.paymentMethod}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(payment.createdAt)} ·{" "}
                        {payment.externalPaymentId}
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
            <AdminCardHeader title="Histórico administrativo" />
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

        <AdminWorkspaceActions
          detail={detail}
          subscription={subscription}
          plans={plans}
          canWrite={actor.canWrite}
        />
      </div>
    </>
  );
}
