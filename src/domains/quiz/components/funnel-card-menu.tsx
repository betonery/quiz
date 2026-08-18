"use client";

import {
  Copy,
  ExternalLink,
  FolderInput,
  MoreVertical,
  Share2,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRefreshDashboardLists } from "@/domains/dashboard/hooks/use-refresh-dashboard-lists";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { deleteQuizAction } from "@/domains/quiz/actions/delete-quiz.action";
import { duplicateQuizAction } from "@/domains/quiz/actions/duplicate-quiz.action";
import { moveQuizToFolderAction } from "@/domains/quiz/actions/quiz-folder.actions";
import type { QuizFolder } from "@/domains/quiz/types/quiz-folder.types";
import type { Quiz } from "@/domains/quiz/types/quiz.types";
import { useToast } from "@/hooks/use-toast";
import { quizKeys } from "@/lib/query-keys";

type FunnelCardMenuProps = {
  quiz: Quiz;
  workspaceSlug: string;
  folders: QuizFolder[];
};

export function FunnelCardMenu({
  quiz,
  workspaceSlug,
  folders,
}: FunnelCardMenuProps) {
  const queryClient = useQueryClient();
  const refreshLists = useRefreshDashboardLists(workspaceSlug);
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicateQuizAction(workspaceSlug, quiz.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      refreshLists();
      toast.success("Funil duplicado com sucesso");
    });
  }

  function handleShare() {
    if (quiz.status !== "published") {
      toast.info("Publique o funil antes de compartilhar o link público");
      return;
    }

    const url = `${window.location.origin}${ROUTES.publicQuiz(quiz.slug)}`;

    void navigator.clipboard.writeText(url).then(() => {
      toast.success("Link público copiado para a área de transferência");
    });
  }

  function handlePreview() {
    window.open(
      ROUTES.publicQuizPreview(quiz.slug),
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteQuizAction(workspaceSlug, quiz.id);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      queryClient.setQueryData<Quiz[]>(
        quizKeys.list(workspaceSlug),
        (current) => current?.filter((item) => item.id !== quiz.id) ?? [],
      );
      setShowDeleteConfirm(false);
      refreshLists();
      toast.success("Funil excluído com sucesso");
    });
  }

  function handleMove(folderId: string | null) {
    startTransition(async () => {
      const result = await moveQuizToFolderAction(workspaceSlug, quiz.id, {
        folderId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setShowMoveDialog(false);
      refreshLists();
      toast.success(
        folderId ? "Funil movido para a pasta" : "Funil removido da pasta",
      );
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
              aria-label="Opções do funil"
              disabled={isPending}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="size-4" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowMoveDialog(true)}>
            <FolderInput className="size-4" />
            Mover para pasta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="size-4" />
            Compartilhar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePreview}>
            <ExternalLink className="size-4" />
            Ver prévia
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showMoveDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Mover funil
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha a pasta de destino para &quot;{quiz.title}&quot;.
            </p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleMove(null)}
                className="flex w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                Sem pasta
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  disabled={isPending || quiz.folder_id === folder.id}
                  onClick={() => handleMove(folder.id)}
                  className="flex w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                >
                  {folder.name}
                  {quiz.folder_id === folder.id ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Atual
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
          >
            <h3
              id="delete-dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              Excluir funil?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. O funil &quot;{quiz.title}&quot;
              será removido permanentemente.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
