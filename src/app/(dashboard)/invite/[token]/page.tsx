import Link from "next/link";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { AcceptInvitationButton } from "@/domains/workspace/components/accept-invitation-button";
import { getInvitationByToken } from "@/domains/workspace/services/workspace.service";
import { createClient } from "@/services/supabase/server";

export const metadata = {
  title: "Aceitar convite",
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `${ROUTES.login}?redirectTo=${encodeURIComponent(`/invite/${token}`)}`,
    );
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">Convite inválido</h1>
        <p className="text-sm text-slate-400">
          Este convite não existe, já foi usado ou expirou.
        </p>
        <Link
          href={ROUTES.dashboard}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-600 px-4 text-sm font-medium text-slate-200 hover:bg-slate-800"
        >
          Ir para o painel
        </Link>
      </div>
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name, slug")
    .eq("id", invitation.workspace_id)
    .maybeSingle();

  const workspaceName = workspace?.name ?? "Workspace";

  return (
    <div className="mx-auto max-w-lg space-y-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">
          Convite de workspace
        </h1>
        <p className="text-sm text-slate-400">
          Você foi convidado para participar de{" "}
          <span className="font-medium text-slate-200">{workspaceName}</span>{" "}
          como{" "}
          <span className="font-medium text-cyan-300">
            {invitation.role === "admin" ? "Admin" : "Membro"}
          </span>
          .
        </p>
      </div>

      <AcceptInvitationButton token={token} />

      <p className="text-center text-xs text-slate-500">
        Após aceitar, você será redirecionado para o workspace.
      </p>
    </div>
  );
}
