import { PLAN_LABELS, type PlanId } from "@/constants/plans";
import type { WorkspacePayment } from "@/domains/billing/types/plan.types";

type PaymentHistoryProps = {
  payments: WorkspacePayment[];
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatPeriod(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
  return `${formatter.format(new Date(start))} → ${formatter.format(new Date(end))}`;
}

function formatStatus(status: WorkspacePayment["status"]): string {
  switch (status) {
    case "paid":
      return "Pago";
    case "failed":
      return "Falhou";
    case "refunded":
      return "Reembolsado";
    default:
      return status;
  }
}

function formatPlanLabel(planId: string): string {
  if (planId in PLAN_LABELS) {
    return PLAN_LABELS[planId as PlanId];
  }

  return planId;
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Histórico de pagamentos
        </h2>
        <p className="text-sm text-slate-400">
          Pagamentos confirmados via plataforma externa.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 px-5 py-8 text-center text-sm text-slate-400">
          Nenhum pagamento registrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Período</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {payments.map((payment) => (
                  <tr key={payment.id} className="bg-[#0c1220]/60">
                    <td className="px-4 py-3 text-slate-200">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency(payment.amount_cents)}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-300">
                      {payment.payment_method.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {formatPlanLabel(payment.plan_id)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatPeriod(payment.period_start, payment.period_end)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          payment.status === "paid"
                            ? "text-emerald-300"
                            : payment.status === "refunded"
                              ? "text-amber-300"
                              : "text-red-300"
                        }
                      >
                        {formatStatus(payment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
