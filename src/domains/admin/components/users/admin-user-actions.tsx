"use client";

import {
  Ban,
  Copy,
  KeyRound,
  Loader2,
  MailCheck,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  changePlatformRoleAction,
  confirmUserEmailAction,
  deleteUserAction,
  generatePasswordResetLinkAction,
  reinstateUserAction,
  suspendUserAction,
  updateInternalNotesAction,
} from "@/domains/admin/actions/admin-users.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import { AdminDialog } from "@/domains/admin/components/ui/admin-dialog";
import {
  AdminField,
  AdminFormError,
  AdminSelect,
  AdminTextarea,
} from "@/domains/admin/components/ui/admin-form-fields";
import {
  AdminCard,
  AdminCardHeader,
} from "@/domains/admin/components/ui/admin-primitives";
import {
  PLATFORM_ROLE_DESCRIPTIONS,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_OPTIONS,
  type PlatformRole,
} from "@/domains/admin/constants/admin.constants";
import type { AdminUserDetail } from "@/domains/admin/types/admin.types";
import { useToast } from "@/hooks/use-toast";

type AdminUserActionsProps = {
  detail: AdminUserDetail;
  canWrite: boolean;
  isSelf: boolean;
};

export function AdminUserActions({
  detail,
  canWrite,
  isSelf,
}: AdminUserActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const user = detail.user;

  const [role, setRole] = useState<PlatformRole>(user.platformRole);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  const [notes, setNotes] = useState(detail.internalNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);

  const [reinstateOpen, setReinstateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleRoleSave() {
    if (role === user.platformRole) return;

    setSavingRole(true);
    setRoleError(null);
    const result = await changePlatformRoleAction({ userId: user.id, role });
    setSavingRole(false);

    if (!result.success) {
      setRoleError(result.error);
      setRole(user.platformRole);
      return;
    }

    toast.success("Papel atualizado.");
    router.refresh();
  }

  async function handleNotesSave() {
    setSavingNotes(true);
    const result = await updateInternalNotesAction({
      userId: user.id,
      notes,
    });
    setSavingNotes(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Notas salvas.");
    router.refresh();
  }

  async function handleSuspend() {
    setSuspending(true);
    setSuspendError(null);
    const result = await suspendUserAction({
      userId: user.id,
      reason: suspendReason,
    });
    setSuspending(false);

    if (!result.success) {
      setSuspendError(result.error);
      return;
    }

    toast.success("Usuário suspenso.");
    setSuspendOpen(false);
    setSuspendReason("");
    router.refresh();
  }

  async function handleConfirmEmail() {
    setBusy("email");
    const result = await confirmUserEmailAction({ userId: user.id });
    setBusy(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("E-mail confirmado.");
    router.refresh();
  }

  async function handleResetLink() {
    setBusy("reset");
    const result = await generatePasswordResetLinkAction({ userId: user.id });
    setBusy(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setResetLink(result.data?.link ?? null);
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <AdminCard>
          <AdminCardHeader
            title="Papel de plataforma"
            description="Define o acesso deste usuário ao painel administrativo."
          />
          <div className="flex flex-col gap-3 px-5 py-4">
            <AdminField
              label="Papel"
              hint={PLATFORM_ROLE_DESCRIPTIONS[role]}
              error={roleError ?? undefined}
            >
              <AdminSelect
                value={role}
                disabled={!canWrite || isSelf}
                onChange={(event) =>
                  setRole(event.target.value as PlatformRole)
                }
              >
                {PLATFORM_ROLE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {PLATFORM_ROLE_LABELS[option]}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>

            {isSelf ? (
              <p className="text-xs text-amber-400/90">
                Você não pode alterar o próprio papel.
              </p>
            ) : null}

            <div>
              <Button
                onClick={handleRoleSave}
                disabled={
                  !canWrite ||
                  isSelf ||
                  savingRole ||
                  role === user.platformRole
                }
              >
                {savingRole ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Salvar papel
              </Button>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Ações de conta"
            description="Operações sobre o acesso do usuário."
          />
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {user.suspendedAt ? (
              <Button
                variant="outline"
                disabled={!canWrite}
                onClick={() => setReinstateOpen(true)}
              >
                <Undo2 className="size-4" />
                Reativar acesso
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled={!canWrite || isSelf}
                onClick={() => setSuspendOpen(true)}
              >
                <Ban className="size-4" />
                Suspender acesso
              </Button>
            )}

            <Button
              variant="outline"
              disabled={!canWrite || busy !== null}
              onClick={handleResetLink}
            >
              {busy === "reset" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Gerar link de senha
            </Button>

            {detail.auth && !detail.auth.emailConfirmedAt ? (
              <Button
                variant="outline"
                disabled={!canWrite || busy !== null}
                onClick={handleConfirmEmail}
              >
                {busy === "email" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <MailCheck className="size-4" />
                )}
                Confirmar e-mail
              </Button>
            ) : null}

            <Button
              variant="destructive"
              disabled={!canWrite || isSelf}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Excluir conta
            </Button>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Notas internas"
            description="Visíveis apenas para a equipe da plataforma."
          />
          <div className="flex flex-col gap-3 px-5 py-4">
            <AdminTextarea
              value={notes}
              disabled={!canWrite}
              maxLength={2000}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Histórico de suporte, acordos comerciais, observações..."
            />
            <div>
              <Button
                variant="outline"
                onClick={handleNotesSave}
                disabled={!canWrite || savingNotes}
              >
                {savingNotes ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Salvar notas
              </Button>
            </div>
          </div>
        </AdminCard>
      </div>

      <AdminDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspender acesso"
        description={`${user.email} perderá a sessão imediatamente e não conseguirá entrar novamente.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSuspendOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspending || suspendReason.trim().length < 3}
            >
              {suspending ? <Loader2 className="size-4 animate-spin" /> : null}
              Suspender
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <AdminField
            label="Motivo"
            hint="Fica registrado na trilha de auditoria."
          >
            <AdminTextarea
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
              placeholder="Ex.: uso indevido da plataforma"
              maxLength={300}
            />
          </AdminField>
          <AdminFormError message={suspendError} />
        </div>
      </AdminDialog>

      <AdminConfirmDialog
        open={reinstateOpen}
        onOpenChange={setReinstateOpen}
        title="Reativar acesso"
        description={`${user.email} voltará a conseguir entrar normalmente.`}
        confirmLabel="Reativar"
        successMessage="Acesso reativado."
        onConfirm={() => reinstateUserAction({ userId: user.id })}
        onSuccess={() => router.refresh()}
      />

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir conta"
        description={`Esta ação é irreversível. Os workspaces em que ${user.email} é proprietário, com todos os funis e métricas, serão apagados junto.`}
        confirmLabel="Excluir definitivamente"
        successMessage="Conta excluída."
        destructive
        confirmationPhrase={user.email}
        onConfirm={() => deleteUserAction({ userId: user.id })}
        onSuccess={() => router.push(ROUTES.admin.users)}
      />

      <AdminDialog
        open={resetLink !== null}
        onOpenChange={() => setResetLink(null)}
        title="Link de redefinição de senha"
        description="Envie este link ao usuário. Ele é de uso único e expira."
        size="md"
        footer={
          <Button variant="ghost" onClick={() => setResetLink(null)}>
            Fechar
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs break-all text-slate-300">
            {resetLink}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              if (!resetLink) return;
              void navigator.clipboard.writeText(resetLink);
              toast.success("Link copiado.");
            }}
          >
            <Copy className="size-4" />
            Copiar link
          </Button>
        </div>
      </AdminDialog>
    </>
  );
}
