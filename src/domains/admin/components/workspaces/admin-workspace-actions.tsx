"use client";

import { CalendarPlus, Loader2, Save, Trash2, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  cancelSubscriptionAction,
  extendSubscriptionAction,
  grantSubscriptionAction,
} from "@/domains/admin/actions/admin-subscriptions.actions";
import {
  deleteWorkspaceAction,
  renameWorkspaceAction,
  transferWorkspaceOwnershipAction,
  updateWorkspaceMemberRoleAction,
} from "@/domains/admin/actions/admin-workspaces.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
} from "@/domains/admin/components/ui/admin-form-fields";
import {
  AdminCard,
  AdminCardHeader,
} from "@/domains/admin/components/ui/admin-primitives";
import type {
  AdminPlanRow,
  AdminSubscriptionRow,
  AdminWorkspaceDetail,
} from "@/domains/admin/types/admin.types";
import { useToast } from "@/hooks/use-toast";

type Props = {
  detail: AdminWorkspaceDetail;
  subscription: AdminSubscriptionRow | null;
  plans: AdminPlanRow[];
  canWrite: boolean;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inOneMonthIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

export function AdminWorkspaceActions({
  detail,
  subscription,
  plans,
  canWrite,
}: Props) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(detail.workspace.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [newOwnerId, setNewOwnerId] = useState(detail.workspace.ownerId);
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const [planId, setPlanId] = useState(
    subscription?.planId ?? plans[0]?.id ?? "",
  );
  const [status, setStatus] = useState(subscription?.status ?? "active");
  const [periodStart, setPeriodStart] = useState(
    subscription?.currentPeriodStart?.slice(0, 10) ?? todayIso(),
  );
  const [periodEnd, setPeriodEnd] = useState(
    subscription?.currentPeriodEnd?.slice(0, 10) ?? inOneMonthIso(),
  );
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(
    null,
  );

  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleRename() {
    setSavingName(true);
    setNameError(null);
    const result = await renameWorkspaceAction({
      workspaceId: detail.workspace.id,
      name,
    });
    setSavingName(false);

    if (!result.success) {
      setNameError(result.error);
      return;
    }
    toast.success("Workspace renomeado.");
    router.refresh();
  }

  async function handleTransfer() {
    setTransferring(true);
    setTransferError(null);
    const result = await transferWorkspaceOwnershipAction({
      workspaceId: detail.workspace.id,
      newOwnerId,
    });
    setTransferring(false);

    if (!result.success) {
      setTransferError(result.error);
      return;
    }
    toast.success("Propriedade transferida.");
    router.refresh();
  }

  async function handleSaveSubscription() {
    setSavingSubscription(true);
    setSubscriptionError(null);
    const result = await grantSubscriptionAction({
      workspaceId: detail.workspace.id,
      planId,
      status,
      periodStart,
      periodEnd,
    });
    setSavingSubscription(false);

    if (!result.success) {
      setSubscriptionError(result.error);
      return;
    }
    toast.success("Assinatura salva.");
    router.refresh();
  }

  async function handleExtend() {
    setExtending(true);
    const result = await extendSubscriptionAction({
      workspaceId: detail.workspace.id,
      days: extendDays,
    });
    setExtending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`Assinatura estendida em ${extendDays} dia(s).`);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <AdminCard>
          <AdminCardHeader
            title="Assinatura"
            description="Conceda, altere ou renove o plano deste workspace."
          />
          <div className="flex flex-col gap-3 px-5 py-4">
            <AdminField label="Plano">
              <AdminSelect
                value={planId}
                disabled={!canWrite}
                onChange={(event) => setPlanId(event.target.value)}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                    {plan.isActive ? "" : " (arquivado)"}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>

            <AdminField label="Status">
              <AdminSelect
                value={status}
                disabled={!canWrite}
                onChange={(event) =>
                  setStatus(event.target.value as typeof status)
                }
              >
                <option value="active">Ativa</option>
                <option value="past_due">Em atraso</option>
                <option value="inactive">Inativa</option>
                <option value="canceled">Cancelada</option>
              </AdminSelect>
            </AdminField>

            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField label="Início">
                <AdminInput
                  type="date"
                  value={periodStart}
                  disabled={!canWrite}
                  onChange={(event) => setPeriodStart(event.target.value)}
                />
              </AdminField>
              <AdminField label="Fim">
                <AdminInput
                  type="date"
                  value={periodEnd}
                  disabled={!canWrite}
                  onChange={(event) => setPeriodEnd(event.target.value)}
                />
              </AdminField>
            </div>

            <AdminFormError message={subscriptionError} />

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleSaveSubscription}
                disabled={!canWrite || savingSubscription || !planId}
              >
                {savingSubscription ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar assinatura
              </Button>

              {subscription ? (
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  disabled={!canWrite}
                >
                  Cancelar assinatura
                </Button>
              ) : null}
            </div>

            {subscription ? (
              <div className="mt-2 flex items-end gap-2 border-t border-slate-800 pt-3">
                <AdminField label="Estender (dias)" className="w-32">
                  <AdminInput
                    type="number"
                    min={1}
                    max={3650}
                    value={extendDays}
                    disabled={!canWrite}
                    onChange={(event) =>
                      setExtendDays(Number(event.target.value))
                    }
                  />
                </AdminField>
                <Button
                  variant="outline"
                  onClick={handleExtend}
                  disabled={!canWrite || extending || extendDays < 1}
                >
                  {extending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CalendarPlus className="size-4" />
                  )}
                  Estender
                </Button>
              </div>
            ) : null}
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader title="Dados do workspace" />
          <div className="flex flex-col gap-3 px-5 py-4">
            <AdminField label="Nome" error={nameError ?? undefined}>
              <AdminInput
                value={name}
                disabled={!canWrite}
                maxLength={60}
                onChange={(event) => setName(event.target.value)}
              />
            </AdminField>
            <div>
              <Button
                variant="outline"
                onClick={handleRename}
                disabled={
                  !canWrite || savingName || name === detail.workspace.name
                }
              >
                {savingName ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Salvar nome
              </Button>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardHeader
            title="Propriedade"
            description="O novo dono precisa já ser membro do workspace."
          />
          <div className="flex flex-col gap-3 px-5 py-4">
            <AdminField label="Proprietário" error={transferError ?? undefined}>
              <AdminSelect
                value={newOwnerId}
                disabled={!canWrite}
                onChange={(event) => setNewOwnerId(event.target.value)}
              >
                {detail.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.fullName?.trim() || member.email}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <div>
              <Button
                variant="outline"
                onClick={handleTransfer}
                disabled={
                  !canWrite ||
                  transferring ||
                  newOwnerId === detail.workspace.ownerId
                }
              >
                {transferring ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserCog className="size-4" />
                )}
                Transferir propriedade
              </Button>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-red-500/20">
          <AdminCardHeader
            title="Zona de risco"
            description="Excluir remove funis, métricas e histórico deste workspace."
          />
          <div className="px-5 py-4">
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={!canWrite}
            >
              <Trash2 className="size-4" />
              Excluir workspace
            </Button>
          </div>
        </AdminCard>
      </div>

      <AdminConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar assinatura"
        description={`Os funis publicados de "${detail.workspace.name}" saem do ar enquanto a assinatura estiver cancelada.`}
        confirmLabel="Cancelar assinatura"
        successMessage="Assinatura cancelada."
        destructive
        onConfirm={() =>
          cancelSubscriptionAction({ workspaceId: detail.workspace.id })
        }
        onSuccess={() => router.refresh()}
      />

      <AdminConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir workspace"
        description={`Ação irreversível: ${detail.workspace.quizCount} funil(is), ${detail.workspace.memberCount} membro(s) e todo o histórico serão apagados.`}
        confirmLabel="Excluir definitivamente"
        successMessage="Workspace excluído."
        destructive
        confirmationPhrase={detail.workspace.slug}
        onConfirm={() =>
          deleteWorkspaceAction({ workspaceId: detail.workspace.id })
        }
        onSuccess={() => router.push(ROUTES.admin.workspaces)}
      />
    </>
  );
}

/** Alterna o papel de um membro dentro do workspace. */
export function AdminMemberRoleControl({
  workspaceId,
  userId,
  role,
  isOwner,
  canWrite,
}: {
  workspaceId: string;
  userId: string;
  role: string;
  isOwner: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  if (isOwner) return null;

  async function handleChange(nextRole: string) {
    setPending(true);
    const result = await updateWorkspaceMemberRoleAction({
      workspaceId,
      userId,
      role: nextRole,
    });
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Papel atualizado.");
    router.refresh();
  }

  return (
    <AdminSelect
      value={role}
      disabled={!canWrite || pending}
      onChange={(event) => handleChange(event.target.value)}
      className="h-7 w-32 text-xs"
    >
      <option value="admin">Administrador</option>
      <option value="member">Membro</option>
    </AdminSelect>
  );
}
