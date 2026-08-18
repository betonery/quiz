"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { importQuizFromShareAction } from "@/domains/quiz/actions/import-quiz-from-share.action";
import type { QuizSharePreview } from "@/domains/quiz/types/quiz-share.types";
import type { UserWorkspace } from "@/domains/workspace/types/workspace.types";

type ShareImportPanelProps = {
  token: string;
  preview: QuizSharePreview;
  isAuthenticated: boolean;
  workspaces: UserWorkspace[];
  defaultWorkspaceSlug?: string;
  loginHref?: string;
};

export function ShareImportPanel({
  token,
  preview,
  isAuthenticated,
  workspaces,
  defaultWorkspaceSlug,
  loginHref,
}: ShareImportPanelProps) {
  const router = useRouter();
  const [workspaceSlug, setWorkspaceSlug] = useState(
    defaultWorkspaceSlug ?? workspaces[0]?.slug ?? "",
  );
  const [title, setTitle] = useState(`${preview.sourceTitle} (importado)`);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-700/60 bg-[#0c1220]/80 p-6">
          <p className="text-sm text-slate-400">Funil compartilhado</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {preview.sourceTitle}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {preview.stepCount} etapa{preview.stepCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          render={<Link href={loginHref ?? ROUTES.login} />}
          className="w-full"
        >
          Entrar para importar
        </Button>
      </div>
    );
  }

  function handleImport() {
    setError(null);
    if (!workspaceSlug) {
      setError("Selecione um workspace");
      return;
    }

    startTransition(async () => {
      const result = await importQuizFromShareAction(workspaceSlug, {
        shareInput: token,
        title,
      });
      if (!result.success) {
        setError(result.error ?? "Não foi possível importar");
        return;
      }
      router.push(ROUTES.quiz(workspaceSlug, result.quizId!));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700/60 bg-[#0c1220]/80 p-6">
        <p className="text-sm text-slate-400">Funil compartilhado</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          {preview.sourceTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {preview.stepCount} etapa{preview.stepCount === 1 ? "" : "s"}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {workspaces.length > 1 ? (
        <div className="space-y-2">
          <label
            htmlFor="workspace"
            className="text-sm font-medium text-slate-200"
          >
            Workspace de destino
          </label>
          <select
            id="workspace"
            value={workspaceSlug}
            onChange={(event) => setWorkspaceSlug(event.target.value)}
            className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.slug}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor="import-title"
          className="text-sm font-medium text-slate-200"
        >
          Nome do funil
        </label>
        <Input
          id="import-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border-slate-700 bg-slate-900/60 text-slate-100"
        />
      </div>

      <Button
        type="button"
        disabled={isPending || !title.trim() || !workspaceSlug}
        onClick={handleImport}
        className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
      >
        {isPending ? "Importando..." : "Importar para meu workspace"}
      </Button>
    </div>
  );
}
