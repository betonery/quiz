"use client";

import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CreateFolderDialog } from "@/domains/dashboard/components/create-folder-dialog";
import { useRefreshDashboardLists } from "@/domains/dashboard/hooks/use-refresh-dashboard-lists";
import {
  deleteQuizFolderAction,
  renameQuizFolderAction,
} from "@/domains/quiz/actions/quiz-folder.actions";
import type { QuizFolder } from "@/domains/quiz/types/quiz-folder.types";
import type { FolderFilter } from "@/domains/quiz/types/quiz-folder.types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FolderActionsMenuProps = {
  folder: QuizFolder;
  workspaceSlug: string;
  activeFilter: FolderFilter;
  onFilterChange: (filter: FolderFilter) => void;
};

export function FolderActionsMenu({
  folder,
  workspaceSlug,
  activeFilter,
  onFilterChange,
}: FolderActionsMenuProps) {
  const refreshLists = useRefreshDashboardLists(workspaceSlug);
  const toast = useToast();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRename() {
    startTransition(async () => {
      const result = await renameQuizFolderAction(workspaceSlug, folder.id, {
        name: renameValue,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pasta renomeada");
      setShowRenameDialog(false);
      refreshLists();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteQuizFolderAction(workspaceSlug, folder.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (activeFilter === folder.id) {
        onFilterChange("all");
      }
      toast.success("Pasta excluída");
      setShowDeleteConfirm(false);
      refreshLists();
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
              className="size-7 shrink-0 text-slate-400"
              aria-label={`Opções da pasta ${folder.name}`}
              disabled={isPending}
            />
          }
        >
          <MoreVertical className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setRenameValue(folder.name);
              setShowRenameDialog(true);
            }}
          >
            <Pencil className="size-4" />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showRenameDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
            onSubmit={(event) => {
              event.preventDefault();
              handleRename();
            }}
          >
            <h3 className="text-lg font-semibold text-foreground">
              Renomear pasta
            </h3>
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={80}
              className="mt-4 bg-background shadow-sm"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRenameDialog(false);
                  setRenameValue(folder.name);
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="brand" disabled={isPending}>
                Salvar
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">
              Excluir pasta?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Os funis dentro de &quot;{folder.name}&quot; serão movidos para
              Sem pasta. A pasta será removida permanentemente.
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
                {isPending ? "Excluindo..." : "Excluir pasta"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type FolderSidebarProps = {
  folders: QuizFolder[];
  workspaceSlug: string;
  activeFilter: FolderFilter;
  onFilterChange: (filter: FolderFilter) => void;
  quizCounts: {
    all: number;
    none: number;
    byFolder: Record<string, number>;
  };
};

export function FolderSidebar({
  folders,
  workspaceSlug,
  activeFilter,
  onFilterChange,
  quizCounts,
}: FolderSidebarProps) {
  const items: Array<{ id: FolderFilter; label: string; count: number }> = [
    { id: "all", label: "Todos", count: quizCounts.all },
    { id: "none", label: "Sem pasta", count: quizCounts.none },
    ...folders.map((folder) => ({
      id: folder.id as FolderFilter,
      label: folder.name,
      count: quizCounts.byFolder[folder.id] ?? 0,
    })),
  ];

  return (
    <aside className="space-y-4">
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = activeFilter === item.id;
          const isFolder = item.id !== "all" && item.id !== "none";
          const folder = isFolder
            ? folders.find((entry) => entry.id === item.id)
            : null;

          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-1 rounded-xl border transition-colors",
                isActive
                  ? "border-cyan-500/40 bg-cyan-500/10"
                  : "border-transparent hover:border-slate-700/60 hover:bg-slate-900/40",
              )}
            >
              <button
                type="button"
                onClick={() => onFilterChange(item.id)}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
              >
                {isFolder ? (
                  <Folder className="size-4 shrink-0 text-cyan-400" />
                ) : null}
                <span className="truncate text-sm font-medium text-slate-200">
                  {item.label}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {item.count}
                </span>
              </button>
              {folder ? (
                <FolderActionsMenu
                  folder={folder}
                  workspaceSlug={workspaceSlug}
                  activeFilter={activeFilter}
                  onFilterChange={onFilterChange}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <CreateFolderDialog workspaceSlug={workspaceSlug} />
    </aside>
  );
}
