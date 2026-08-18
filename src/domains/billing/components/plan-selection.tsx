"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/domains/billing/types/plan.types";
import { formatLimit } from "@/domains/billing/utils/plan-limits.utils";
import { cn } from "@/lib/utils";

type PlanSelectionProps = {
  plans: Plan[];
  currentPlanId?: string | null;
  isOwner: boolean;
};

function formatPrice(cents: number | null): string {
  if (cents == null) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function PlanSelection({
  plans,
  currentPlanId,
  isOwner,
}: PlanSelectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const canCheckout =
            isOwner && !isCurrent && Boolean(plan.checkout_url);

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl border bg-gradient-to-br from-[#0c1220] to-[#0a1628] p-6 shadow-xl",
                isCurrent ? "border-cyan-500/40" : "border-slate-700/60",
              )}
            >
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white">
                  {plan.name}
                </h3>
                {plan.description ? (
                  <p className="text-sm text-slate-400">{plan.description}</p>
                ) : null}
              </div>

              <p className="mt-4 text-3xl font-semibold text-white">
                {formatPrice(plan.price_cents)}
                <span className="text-sm font-normal text-slate-400">/mês</span>
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-cyan-400" />
                  Até {formatLimit(plan.limits.max_quizzes)} funis
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-cyan-400" />
                  Até {formatLimit(plan.limits.max_team_members)} membros
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-cyan-400" />
                  {formatLimit(plan.limits.max_custom_domains)} domínio
                  {plan.limits.max_custom_domains === 1 ? "" : "s"}{" "}
                  personalizado
                  {plan.limits.max_custom_domains === -1 ? "s" : ""}
                </li>
              </ul>

              {canCheckout ? (
                <Button
                  nativeButton={false}
                  className="mt-6 w-full"
                  variant="brand"
                  render={
                    <a
                      href={plan.checkout_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  Assinar {plan.name}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="mt-6 w-full"
                  variant={isCurrent ? "outline" : "brand"}
                  disabled={!isOwner || isCurrent || !plan.checkout_url}
                >
                  {isCurrent ? "Plano atual" : `Assinar ${plan.name}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {!isOwner ? (
        <p className="text-sm text-slate-400">
          Apenas o owner do workspace pode assinar ou alterar o plano.
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          O checkout abre em uma nova guia. A assinatura é ativada
          automaticamente após a confirmação do pagamento.
        </p>
      )}
    </div>
  );
}
