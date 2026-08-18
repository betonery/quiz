"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateWorkspaceNameAction } from "@/domains/workspace/actions/workspace.actions";
import { cn } from "@/lib/utils";

type WorkspaceRenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  defaultName: string;
};

export function WorkspaceRenameDialog({
  open,
  onOpenChange,
  workspaceSlug,
  defaultName,
}: WorkspaceRenameDialogProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setError(null);
    }
  }, [open, defaultName]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateWorkspaceNameAction(workspaceSlug, { name });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Não foi possível renomear o workspace");
      return;
    }

    onOpenChange(false);
    router.refresh();
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/70 bg-[#0c1220] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <Pencil className="size-4 text-cyan-300" />
            <h2 className="text-lg font-semibold text-white">
              Renomear workspace
            </h2>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="workspace-name"
              className="text-sm font-medium text-slate-200"
            >
              Nome do workspace
            </label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={cn(
                "border-slate-700/60 bg-slate-900/50 text-slate-100",
                "placeholder:text-slate-500 focus-visible:border-cyan-500/50 focus-visible:ring-cyan-500/20",
              )}
              autoFocus
            />
            <p className="text-xs text-slate-500">
              O identificador @{workspaceSlug} não muda — apenas o nome exibido.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-cyan-600 text-white hover:bg-cyan-500"
              disabled={
                isSubmitting ||
                !name.trim() ||
                name.trim() === defaultName.trim()
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
