import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaymentHistory } from "@/domains/billing/components/payment-history";
import { PlanSelection } from "@/domains/billing/components/plan-selection";
import { listWorkspacePayments } from "@/domains/billing/services/payment.service";
import { listActivePlans } from "@/domains/billing/services/plan.service";
import { getWorkspaceSubscriptionWithPlan } from "@/domains/billing/services/subscription.service";
import { formatLimit } from "@/domains/billing/utils/plan-limits.utils";
import { ROUTES } from "@/constants/routes";
import {
  getWorkspaceBySlug,
  userHasWorkspaceAccess,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Billing",
};

type BillingPageProps = {
  params: Promise<{ workspaceSlug: string }>;
};

export default async function BillingPage({ params }: BillingPageProps) {
  const { workspaceSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) {
    notFound();
  }

  const hasAccess = await userHasWorkspaceAccess(user.id, workspace.id);
  if (!hasAccess) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const [plans, subscription, payments] = await Promise.all([
    listActivePlans(),
    getWorkspaceSubscriptionWithPlan(workspace.id),
    listWorkspacePayments(workspace.id),
  ]);

  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.status === "canceled";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-3">
        <Link
          href={ROUTES.dashboard}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para funis
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Planos e assinatura
        </h1>
        <p className="text-sm text-slate-400">
          Escolha um plano para o workspace{" "}
          <span className="font-medium text-slate-200">{workspace.name}</span>.
          Sem assinatura ativa, não é possível criar funis.
        </p>
      </div>

      {isActive && subscription ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-4">
          <p className="text-sm text-emerald-200">
            Plano atual:{" "}
            <span className="font-semibold text-emerald-100">
              {subscription.plan.name}
            </span>
          </p>
          <p className="mt-1 text-xs text-emerald-300/80">
            Até {formatLimit(subscription.plan.limits.max_quizzes)} funis · Até{" "}
            {formatLimit(subscription.plan.limits.max_team_members)} membros
          </p>
        </div>
      ) : isCanceled && subscription ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
          Sua assinatura expirou. Renove o plano{" "}
          <span className="font-medium text-red-50">
            {subscription.plan.name}
          </span>{" "}
          para continuar usando o workspace.
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
          Nenhuma assinatura ativa. Assine um plano para começar a criar funis.
        </div>
      )}

      <PaymentHistory payments={payments} />

      <PlanSelection
        plans={plans}
        currentPlanId={isActive ? subscription?.plan_id : null}
        isOwner={membership?.role === "owner"}
      />
    </div>
  );
}
