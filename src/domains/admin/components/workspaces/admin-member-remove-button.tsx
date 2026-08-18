"use client";

import { UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { removeWorkspaceMemberAction } from "@/domains/admin/actions/admin-workspaces.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";

export function AdminMemberRemoveButton({
  workspaceId,
  userId,
  email,
  disabled,
}: {
  workspaceId: string;
  userId: string;
  email: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={`Remover ${email}`}
        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <UserMinus className="size-3.5" />
      </button>

      <AdminConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Remover membro"
        description={`${email} perderá o acesso a este workspace. Os funis criados por ele permanecem.`}
        confirmLabel="Remover"
        successMessage="Membro removido."
        destructive
        onConfirm={() => removeWorkspaceMemberAction({ workspaceId, userId })}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
