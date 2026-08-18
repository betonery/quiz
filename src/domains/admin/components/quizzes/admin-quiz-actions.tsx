"use client";

import { EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteQuizAction,
  unpublishQuizAction,
} from "@/domains/admin/actions/admin-quizzes.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import type { AdminQuizRow } from "@/domains/admin/types/admin.types";

export function AdminQuizActions({
  quiz,
  canWrite,
}: {
  quiz: AdminQuizRow;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setUnpublishOpen(true)}
        disabled={!canWrite || quiz.status !== "published"}
        aria-label={`Despublicar ${quiz.title}`}
        title="Despublicar"
        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <EyeOff className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        disabled={!canWrite}
        aria-label={`Excluir ${quiz.title}`}
        title="Excluir"
        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="size-3.5" />
      </button>

      <AdminConfirmDialog
        open={unpublishOpen}
        onOpenChange={setUnpublishOpen}
        title="Despublicar funil"
        description={`"${quiz.title}" sai do ar imediatamente. O rascunho é preservado e o dono pode republicar.`}
        confirmLabel="Despublicar"
        successMessage="Funil despublicado."
        destructive
        onConfirm={() => unpublishQuizAction({ quizId: quiz.id })}
        onSuccess={() => router.refresh()}
      />

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir funil"
        description={`Ação irreversível: "${quiz.title}", suas etapas, widgets e métricas serão apagados.`}
        confirmLabel="Excluir definitivamente"
        successMessage="Funil excluído."
        destructive
        confirmationPhrase={quiz.slug}
        onConfirm={() => deleteQuizAction({ quizId: quiz.id })}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
