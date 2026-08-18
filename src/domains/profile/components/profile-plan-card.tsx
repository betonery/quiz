import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import type { WorkspaceSubscriptionWithPlan } from "@/domains/billing/types/plan.types";
import { formatLimit } from "@/domains/billing/utils/plan-limits.utils";
import { ROUTES } from "@/constants/routes";

type ProfilePlanCardProps = {
  workspaceName: string;
  workspaceSlug: string;
  subscription: WorkspaceSubscriptionWithPlan | null;
};

export function ProfilePlanCard({
  workspaceName,
  workspaceSlug,
  subscription,
}: ProfilePlanCardProps) {
  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.status === "canceled";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0c1220] to-[#0a1628] shadow-xl lg:sticky lg:top-8">
      <div className="border-b border-slate-700/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-xs text-slate-400">Plano do workspace</p>
            <p className="font-semibold text-white">{workspaceName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {isActive && subscription ? (
          <>
            <div>
              <p className="text-xs text-slate-400">Plano atual</p>
              <p className="text-lg font-semibold text-emerald-200">
                {subscription.plan.name}
              </p>
            </div>
            <ul className="space-y-2 text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-cyan-400" />
                Até {formatLimit(subscription.plan.limits.max_quizzes)} funis
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-cyan-400" />
                Até {formatLimit(
                  subscription.plan.limits.max_team_members,
                )}{" "}
                membros
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-cyan-400" />
                {formatLimit(subscription.plan.limits.max_custom_domains)}{" "}
                domínio
                {subscription.plan.limits.max_custom_domains === 1
                  ? ""
                  : "s"}{" "}
                personalizado
              </li>
            </ul>
          </>
        ) : isCanceled && subscription ? (
          <p className="text-sm text-red-200">
            Assinatura expirada ({subscription.plan.name}). Renove para
            continuar.
          </p>
        ) : (
          <p className="text-sm text-amber-100">
            Nenhuma assinatura ativa neste workspace.
          </p>
        )}

        <p className="text-xs text-slate-500">
          Referente ao workspace selecionado no header.
        </p>
      </div>

      <div className="border-t border-slate-700/50 px-5 py-4">
        <Link
          href={ROUTES.billing(workspaceSlug)}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-cyan-600 px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
        >
          {isActive ? "Gerenciar plano" : "Escolher plano"}
        </Link>
      </div>
    </div>
  );
}
