import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShareImportPanel } from "@/domains/quiz/components/share/share-import-panel";
import { getSharePreviewByToken } from "@/domains/quiz/services/quiz-share.service";
import { listWorkspacesForUser } from "@/domains/workspace/services/workspace.service";
import { ROUTES } from "@/constants/routes";
import { createClient } from "@/services/supabase/server";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export const metadata = {
  title: "Importar funil compartilhado",
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const preview = await getSharePreviewByToken(token);

  if (!preview) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const loginHref = `${ROUTES.login}?redirect=${encodeURIComponent(`${appOrigin}${ROUTES.share(token)}`)}`;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
        <div className="w-full max-w-md">
          <ShareImportPanel
            token={token}
            preview={preview}
            isAuthenticated={false}
            workspaces={[]}
            loginHref={loginHref}
          />
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href={ROUTES.home} className="text-cyan-400 hover:underline">
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const workspaces = await listWorkspacesForUser(user.id);
  if (workspaces.length === 0) {
    redirect(ROUTES.home);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md">
        <ShareImportPanel
          token={token}
          preview={preview}
          isAuthenticated
          workspaces={workspaces}
        />
        <p className="mt-6 text-center text-sm text-slate-500">
          <Link
            href={ROUTES.dashboard}
            className="text-cyan-400 hover:underline"
          >
            Ir para o dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
