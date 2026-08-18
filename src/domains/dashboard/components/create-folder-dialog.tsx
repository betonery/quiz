"use client";

import { FolderPlus, Loader2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRefreshDashboardLists } from "@/domains/dashboard/hooks/use-refresh-dashboard-lists";
import { createQuizFolderAction } from "@/domains/quiz/actions/quiz-folder.actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CreateFolderDialogProps = {
  workspaceSlug: string;
  triggerClassName?: string;
};

export function CreateFolderDialog({
  workspaceSlug,
  triggerClassName,
}: CreateFolderDialogProps) {
  const refreshLists = useRefreshDashboardLists(workspaceSlug);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    setName("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createQuizFolderAction(workspaceSlug, { name });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Pasta criada");
      setOpen(false);
      setName("");
      refreshLists();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-start gap-2 border-slate-700/60 bg-slate-900/40 text-slate-200 hover:border-cyan-500/40 hover:bg-slate-800/80 hover:text-white",
          triggerClassName,
        )}
      >
        <FolderPlus className="size-4" />
        Nova pasta
      </Button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <button
                type="button"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                aria-label="Fechar"
                onClick={handleClose}
              />
              <div
                role="dialog"
                aria-labelledby="create-folder-title"
                className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700/70 bg-[#0c1220] p-6 shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2
                    id="create-folder-title"
                    className="text-lg font-semibold text-white"
                  >
                    Nova pasta
                  </h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                    aria-label="Fechar"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nome da pasta"
                    maxLength={80}
                    autoFocus
                    className="border-slate-700 bg-slate-900/60 text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" variant="brand" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar pasta"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
