"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminDialog } from "@/domains/admin/components/ui/admin-dialog";
import {
  AdminFormError,
  AdminInput,
} from "@/domains/admin/components/ui/admin-form-fields";
import type { AdminActionResult } from "@/domains/admin/types/admin.types";
import { useToast } from "@/hooks/use-toast";

type AdminConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  successMessage: string;
  destructive?: boolean;
  /** Exige digitar exatamente este texto — usado nas ações irreversíveis. */
  confirmationPhrase?: string;
  onConfirm: () => Promise<AdminActionResult>;
  onSuccess?: () => void;
};

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  successMessage,
  destructive = false,
  confirmationPhrase,
  onConfirm,
  onSuccess,
}: AdminConfirmDialogProps) {
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");

  const phraseOk = !confirmationPhrase || typed.trim() === confirmationPhrase;

  function close() {
    setTyped("");
    setError(null);
    onOpenChange(false);
  }

  async function handleConfirm() {
    if (!phraseOk) return;

    setPending(true);
    setError(null);
    const result = await onConfirm();
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast.success(successMessage);
    close();
    onSuccess?.();
  }

  return (
    <AdminDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={pending || !phraseOk}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-300">{description}</p>

        {confirmationPhrase ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-slate-500">
              Digite{" "}
              <strong className="text-slate-300">{confirmationPhrase}</strong>{" "}
              para confirmar:
            </p>
            <AdminInput
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={confirmationPhrase}
              autoComplete="off"
            />
          </div>
        ) : null}

        <AdminFormError message={error} />
      </div>
    </AdminDialog>
  );
}
