import {
  Building2,
  CreditCard,
  Layers,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { AdminTrendChart } from "@/domains/admin/components/overview/admin-trend-chart";
import { AdminStatCard } from "@/domains/admin/components/ui/admin-stat-card";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  AdminEmpty,
} from "@/domains/admin/components/ui/admin-primitives";
import {
  AUDIT_ACTION_LABELS,
  PLATFORM_ROLE_LABELS,
} from "@/domains/admin/constants/admin.constants";
import type { AdminOverviewMetrics } from "@/domains/admin/types/admin.types";
import {
  formatCents,
  formatCompactNumber,
  formatRate,
  formatRelativeTime,
} from "@/domains/admin/utils/admin-format.utils";

export function AdminOverview({ metrics }: { metrics: AdminOverviewMetrics }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Usuários"
          value={formatCompactNumber(metrics.users.total)}
          hint={`+${metrics.users.last7Days} nos últimos 7 dias`}
          icon={Users}
        />
        <AdminStatCard
          label="Workspaces"
          value={formatCompactNumber(metrics.workspaces.total)}
          hint={`${metrics.workspaces.withActiveSubscription} com assinatura ativa`}
          icon={Building2}
        />
        <AdminStatCard
          label="Funis"
          value={formatCompactNumber(metrics.quizzes.total)}
          hint={`${metrics.quizzes.published} publicados`}
          icon={Layers}
        />
        <AdminStatCard
          label="MRR estimado"
          value={formatCents(metrics.subscriptions.mrrCents)}
          hint={`${metrics.subscriptions.active} assinatura(s) ativa(s)`}
          icon={TrendingUp}
          tone="success"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Receita 30 dias"
          value={formatCents(metrics.revenue.last30DaysCents)}
          hint={`${metrics.revenue.paymentCount30Days} pagamento(s)`}
          icon={Receipt}
        />
        <AdminStatCard
          label="Receita total"
          value={formatCents(metrics.revenue.allTimeCents)}
          hint={
            metrics.revenue.refundedLast30DaysCents > 0
              ? `${formatCents(metrics.revenue.refundedLast30DaysCents)} reembolsados em 30d`
              : "Sem reembolsos em 30 dias"
          }
          icon={Receipt}
        />
        <AdminStatCard
          label="Inadimplência"
          value={String(metrics.subscriptions.pastDue)}
          hint={`${metrics.subscriptions.canceled} cancelada(s)`}
          icon={CreditCard}
          tone={metrics.subscriptions.pastDue > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="Conversão dos funis"
          value={formatRate(metrics.traffic.conversionRate)}
          hint={`${formatCompactNumber(metrics.traffic.views30Days)} visitas em 30 dias`}
          icon={TrendingUp}
        />
      </section>

      <AdminCard>
        <AdminCardHeader
          title="Crescimento — últimos 30 dias"
          description="Novos cadastros e funis criados por dia"
        />
        <AdminTrendChart data={metrics.trend} />
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard>
          <AdminCardHeader
            title="Últimos cadastros"
            action={
              <Link
                href={ROUTES.admin.users}
                className="text-xs text-cyan-400 hover:underline"
              >
                Ver todos
              </Link>
            }
          />
          {metrics.recentUsers.length === 0 ? (
            <AdminEmpty title="Nenhum usuário cadastrado ainda." />
          ) : (
            <ul className="divide-y divide-slate-800/50">
              {metrics.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={ROUTES.admin.user(user.id)}
                      className="block truncate text-sm text-slate-200 hover:text-cyan-300"
                    >
                      {user.fullName?.trim() || user.email}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                  {user.platformRole !== "user" ? (
                    <AdminBadge tone="accent">
                      {PLATFORM_ROLE_LABELS[user.platformRole]}
                    </AdminBadge>
                  ) : null}
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Últimos pagamentos"
            action={
              <Link
                href={ROUTES.admin.payments}
                className="text-xs text-cyan-400 hover:underline"
              >
                Ver todos
              </Link>
            }
          />
          {metrics.recentPayments.length === 0 ? (
            <AdminEmpty title="Nenhum pagamento registrado." />
          ) : (
            <ul className="divide-y divide-slate-800/50">
              {metrics.recentPayments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-200">
                      {payment.workspaceName ?? "—"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {payment.planName} · {payment.paymentMethod}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-emerald-300">
                    {formatCents(payment.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard>
          <AdminCardHeader
            title="Distribuição por plano"
            description="Assinaturas ativas"
          />
          {metrics.planDistribution.length === 0 ? (
            <AdminEmpty title="Nenhuma assinatura ativa." />
          ) : (
            <ul className="flex flex-col gap-3 px-5 py-4">
              {metrics.planDistribution.map((plan) => {
                const total = metrics.subscriptions.active || 1;
                const percent = Math.round((plan.count / total) * 100);

                return (
                  <li key={plan.planId} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{plan.planName}</span>
                      <span className="text-slate-400">
                        {plan.count}{" "}
                        <span className="text-slate-600">({percent}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-[#3987e5]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Atividade administrativa"
            action={
              <Link
                href={ROUTES.admin.audit}
                className="text-xs text-cyan-400 hover:underline"
              >
                Ver trilha
              </Link>
            }
          />
          {metrics.recentAudit.length === 0 ? (
            <AdminEmpty
              title="Nenhuma ação registrada."
              description="Toda alteração feita no painel aparece aqui."
            />
          ) : (
            <ul className="divide-y divide-slate-800/50">
              {metrics.recentAudit.map((log) => (
                <li key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <AdminBadge tone="neutral">
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </AdminBadge>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-300">{log.summary}</p>
                  <p className="text-xs text-slate-600">{log.actorEmail}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
