import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { ACTIVE_WORKSPACE_COOKIE } from "@/constants/workspace";
import { ROUTES } from "@/constants/routes";
import { formatLimit } from "@/domains/billing/utils/plan-limits.utils";
import { getWorkspaceSubscriptionWithPlan } from "@/domains/billing/services/subscription.service";
import {
  listWorkspacesForUser,
  resolveActiveWorkspaceForUser,
} from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export const metadata = {
  title: "Seu Plano",
};

export default async function DashboardPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  const workspaces = await listWorkspacesForUser(user.id);
  if (workspaces.length === 0) {
    redirect(ROUTES.login);
  }

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  const activeWorkspace = await resolveActiveWorkspaceForUser({
    userId: user.id,
    cookieSlug,
  });

  if (!activeWorkspace) {
    redirect(ROUTES.dashboard);
  }

  const subscription = await getWorkspaceSubscriptionWithPlan(
    activeWorkspace.id,
  );
  const isActive = subscription?.status === "active";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link
          href={ROUTES.dashboard}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para funis
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Seu Plano
        </h1>
        <p className="text-sm text-slate-400">
          Assinatura do workspace{" "}
          <span className="font-medium text-slate-200">
            {activeWorkspace.name}
          </span>
          .
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0c1220] to-[#0a1628] shadow-xl">
        <div className="border-b border-slate-700/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-sm text-slate-400">Plano atual</p>
              <p className="text-2xl font-semibold text-white">
                {isActive && subscription
                  ? subscription.plan.name
                  : "Sem assinatura"}
              </p>
            </div>
          </div>
        </div>

        {isActive && subscription ? (
          <ul className="space-y-3 px-6 py-5">
            <li className="flex items-center gap-3 text-sm text-slate-200">
              <Check className="size-4 shrink-0 text-cyan-400" />
              Até {formatLimit(subscription.plan.limits.max_quizzes)} funis
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-200">
              <Check className="size-4 shrink-0 text-cyan-400" />
              Até {formatLimit(subscription.plan.limits.max_team_members)}{" "}
              membros
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-200">
              <Check className="size-4 shrink-0 text-cyan-400" />
              Até {formatLimit(
                subscription.plan.limits.max_custom_domains,
              )}{" "}
              domínios personalizados
            </li>
          </ul>
        ) : (
          <div className="px-6 py-5 text-sm text-slate-400">
            Assine um plano para desbloquear a criação de funis neste workspace.
          </div>
        )}

        <div className="border-t border-slate-700/50 px-6 py-5">
          <Link
            href={ROUTES.billing(activeWorkspace.slug)}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-cyan-600 px-4 text-sm font-medium text-white transition-colors hover:bg-cyan-500 sm:w-auto"
          >
            {isActive ? "Gerenciar plano" : "Escolher plano"}
          </Link>
        </div>
      </div>
    </div>
  );
}
