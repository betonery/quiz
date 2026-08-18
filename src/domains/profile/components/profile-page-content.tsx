import Link from "next/link";
import { ArrowLeft, Shield, UserRound } from "lucide-react";
import type { WorkspaceSubscriptionWithPlan } from "@/domains/billing/types/plan.types";
import { PasswordForm } from "@/domains/profile/components/password-form";
import { ProfileForm } from "@/domains/profile/components/profile-form";
import { ProfilePlanCard } from "@/domains/profile/components/profile-plan-card";
import { ROUTES } from "@/constants/routes";
import type { UserProfile } from "@/domains/workspace/types/workspace.types";
import { cn } from "@/lib/utils";

type ProfilePageContentProps = {
  profile: UserProfile;
  workspaceName: string;
  workspaceSlug: string;
  subscription: WorkspaceSubscriptionWithPlan | null;
};

function getInitials(fullName: string | null, email: string): string {
  const source = fullName?.trim() || email.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatMemberSince(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function ProfilePageContent({
  profile,
  workspaceName,
  workspaceSlug,
  subscription,
}: ProfilePageContentProps) {
  const displayName =
    profile.full_name?.trim() || profile.email.split("@")[0] || "Usuário";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3">
        <Link
          href={ROUTES.dashboard}
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para funis
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Meu perfil
        </h1>
        <p className="text-sm text-slate-400">
          Gerencie suas informações pessoais, segurança e visualize o plano do
          workspace.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0c1220] via-[#0a1628] to-[#071018] p-6 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="size-16 rounded-2xl border border-slate-700/60 object-cover"
            />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-xl font-semibold text-cyan-200">
              {getInitials(profile.full_name, profile.email)}
            </span>
          )}
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-white">{displayName}</p>
            <p className="text-sm text-slate-400">{profile.email}</p>
            <span className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
              Membro desde {formatMemberSince(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section
            className={cn(
              "rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0c1220] to-[#0a1628] p-6 shadow-xl",
            )}
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                <UserRound className="size-4" />
              </span>
              <h2 className="text-lg font-semibold text-white">
                Informações pessoais
              </h2>
            </div>
            <ProfileForm
              email={profile.email}
              defaultFullName={profile.full_name ?? ""}
            />
          </section>

          <section className="rounded-2xl border border-slate-700/60 bg-gradient-to-br from-[#0c1220] to-[#0a1628] p-6 shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
                <Shield className="size-4" />
              </span>
              <h2 className="text-lg font-semibold text-white">Segurança</h2>
            </div>
            <PasswordForm />
          </section>
        </div>

        <ProfilePlanCard
          workspaceName={workspaceName}
          workspaceSlug={workspaceSlug}
          subscription={subscription}
        />
      </div>
    </div>
  );
}
