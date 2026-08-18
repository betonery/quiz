"use client";

import Link from "next/link";
import { FilePlus2, Link2, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { createQuizAction } from "@/domains/quiz/actions/create-quiz.action";
import { importQuizFromShareAction } from "@/domains/quiz/actions/import-quiz-from-share.action";
import { previewQuizShareAction } from "@/domains/quiz/actions/preview-quiz-share.action";
import type { QuizSharePreview } from "@/domains/quiz/types/quiz-share.types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CreateMode = "choose" | "blank" | "import";

type CreateFunnelDialogProps = {
  workspaceSlug: string;
  folderId?: string | null;
  canCreateQuiz?: boolean;
  billingHref?: string;
  subscriptionMessage?: string;
  triggerClassName?: string;
  initialImportToken?: string;
  defaultOpen?: boolean;
};

export function CreateFunnelDialog({
  workspaceSlug,
  folderId = null,
  canCreateQuiz = true,
  billingHref = ROUTES.billing(workspaceSlug),
  subscriptionMessage,
  triggerClassName,
  initialImportToken,
  defaultOpen = false,
}: CreateFunnelDialogProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<CreateMode>("choose");
  const [title, setTitle] = useState("");
  const [shareInput, setShareInput] = useState(initialImportToken ?? "");
  const [preview, setPreview] = useState<QuizSharePreview | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPreviewPending, startPreviewTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (defaultOpen && initialImportToken) {
      setOpen(true);
      setMode("import");
      setShareInput(initialImportToken);
    }
  }, [defaultOpen, initialImportToken]);

  function resetState() {
    setMode(initialImportToken ? "import" : "choose");
    setTitle("");
    setShareInput(initialImportToken ?? "");
    setPreview(null);
  }

  function handleOpen() {
    resetState();
    setOpen(true);
  }

  function handleClose() {
    if (isPending || isPreviewPending) return;
    setOpen(false);
    resetState();
  }

  function handlePreviewShare() {
    setPreview(null);
    startPreviewTransition(async () => {
      const result = await previewQuizShareAction(shareInput);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setPreview(result.data);
      if (!title.trim()) {
        setTitle(`${result.data.sourceTitle} (importado)`);
      }
    });
  }

  function handleSubmitBlank(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createQuizAction(workspaceSlug, {
        title,
        folderId,
      });
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível criar o funil");
        return;
      }
      setOpen(false);
      router.push(ROUTES.quiz(workspaceSlug, result.quizId!));
      router.refresh();
    });
  }

  function handleSubmitImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!preview) {
      toast.error("Visualize o funil antes de importar");
      return;
    }

    startTransition(async () => {
      const result = await importQuizFromShareAction(workspaceSlug, {
        shareInput,
        title,
        folderId,
      });
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível importar o funil");
        return;
      }
      setOpen(false);
      router.push(ROUTES.quiz(workspaceSlug, result.quizId!));
      router.refresh();
    });
  }

  if (!canCreateQuiz) {
    return (
      <Link
        href={billingHref}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/60 px-4 text-sm font-medium text-white hover:border-cyan-500/40 hover:bg-slate-800",
          triggerClassName,
        )}
        title={subscriptionMessage}
      >
        Escolher plano
      </Link>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="brand"
        onClick={handleOpen}
        className={cn("gap-2", triggerClassName)}
      >
        <Plus className="size-4" />
        Novo Funil
      </Button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
              <button
                type="button"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                aria-label="Fechar"
                onClick={handleClose}
              />
              <div
                role="dialog"
                aria-labelledby="create-funnel-title"
                className="relative z-10 my-auto flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0c1220] shadow-2xl"
              >
                <header className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
                  <div>
                    <h2
                      id="create-funnel-title"
                      className="text-lg font-semibold text-white"
                    >
                      {mode === "choose"
                        ? "Criar funil"
                        : mode === "blank"
                          ? "Novo funil em branco"
                          : "Importar por link"}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {mode === "choose"
                        ? "Escolha como deseja começar."
                        : mode === "blank"
                          ? "Dê um nome para identificar seu funil."
                          : "Cole o link compartilhado e visualize antes de importar."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending || isPreviewPending}
                    className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                    aria-label="Fechar"
                  >
                    <X className="size-4" />
                  </button>
                </header>

                {mode === "choose" ? (
                  <div className="space-y-3 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setMode("blank")}
                      className="flex w-full items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-left transition-colors hover:border-cyan-500/40 hover:bg-slate-900/70"
                    >
                      <FilePlus2 className="mt-0.5 size-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">
                          Novo funil em branco
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Comece do zero no editor de funis.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("import")}
                      className="flex w-full items-start gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 text-left transition-colors hover:border-cyan-500/40 hover:bg-slate-900/70"
                    >
                      <Link2 className="mt-0.5 size-5 text-cyan-400" />
                      <div>
                        <p className="font-medium text-white">
                          Importar por link
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Use um link compartilhado por outro usuário.
                        </p>
                      </div>
                    </button>
                  </div>
                ) : null}

                {mode === "blank" ? (
                  <form onSubmit={handleSubmitBlank} className="px-5 py-4">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        <label
                          htmlFor="funnel-title"
                          className="block text-sm font-medium text-slate-200"
                        >
                          Nome do funil
                        </label>
                        <Input
                          id="funnel-title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Digite o nome do funil..."
                          autoFocus
                          disabled={isPending}
                          className="border-slate-700 bg-slate-900/60 text-slate-100"
                        />
                      </div>
                      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMode("choose")}
                          disabled={isPending}
                          className="border-slate-600 bg-transparent text-slate-200"
                        >
                          Voltar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isPending || !title.trim()}
                          className="bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Criando...
                            </>
                          ) : (
                            "Criar funil"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : null}

                {mode === "import" ? (
                  <form onSubmit={handleSubmitImport} className="px-5 py-4">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        <label
                          htmlFor="share-input"
                          className="block text-sm font-medium text-slate-200"
                        >
                          Link ou token
                        </label>
                        <Input
                          id="share-input"
                          value={shareInput}
                          onChange={(event) => {
                            setShareInput(event.target.value);
                            setPreview(null);
                          }}
                          placeholder="https://.../share/abc123 ou token"
                          autoFocus
                          disabled={isPending || isPreviewPending}
                          className="border-slate-700 bg-slate-900/60 text-slate-100"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPreviewPending || !shareInput.trim()}
                        onClick={handlePreviewShare}
                        className="w-full border-slate-600 bg-transparent text-slate-200"
                      >
                        {isPreviewPending ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Visualizando...
                          </>
                        ) : (
                          "Visualizar funil"
                        )}
                      </Button>
                      {preview ? (
                        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                          <p className="font-medium text-cyan-100">
                            {preview.sourceTitle}
                          </p>
                          <p className="mt-1 text-sm text-cyan-100/80">
                            {preview.stepCount} etapa
                            {preview.stepCount === 1 ? "" : "s"}
                          </p>
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-3">
                        <label
                          htmlFor="import-title"
                          className="block text-sm font-medium text-slate-200"
                        >
                          Nome do novo funil
                        </label>
                        <Input
                          id="import-title"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Nome do funil importado"
                          disabled={isPending}
                          className="border-slate-700 bg-slate-900/60 text-slate-100"
                        />
                      </div>
                      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMode("choose")}
                          disabled={isPending}
                          className="border-slate-600 bg-transparent text-slate-200"
                        >
                          Voltar
                        </Button>
                        <Button
                          type="submit"
                          disabled={isPending || !title.trim() || !preview}
                          className="bg-cyan-600 text-white hover:bg-cyan-500"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            "Importar funil"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
