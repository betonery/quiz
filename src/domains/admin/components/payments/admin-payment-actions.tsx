"use client";

import { Loader2, Plus, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  recordManualPaymentAction,
  refundPaymentAction,
} from "@/domains/admin/actions/admin-payments.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import { AdminDialog } from "@/domains/admin/components/ui/admin-dialog";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
  AdminSwitch,
} from "@/domains/admin/components/ui/admin-form-fields";
import type {
  AdminPaymentRow,
  AdminPlanRow,
} from "@/domains/admin/types/admin.types";
import { formatCents } from "@/domains/admin/utils/admin-format.utils";
import { useToast } from "@/hooks/use-toast";

type WorkspaceOption = { id: string; name: string; slug: string };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inOneMonthIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

/** Referência sugerida para lançamentos feitos à mão. */
function suggestReference(): string {
  return `manual-${Date.now().toString(36)}`;
}

export function AdminManualPaymentButton({
  workspaces,
  plans,
  canWrite,
}: {
  workspaces: WorkspaceOption[];
  plans: AdminPlanRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [amountReais, setAmountReais] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [externalPaymentId, setExternalPaymentId] =
    useState(suggestReference());
  const [periodStart, setPeriodStart] = useState(todayIso());
  const [periodEnd, setPeriodEnd] = useState(inOneMonthIso());
  const [activateSubscription, setActivateSubscription] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function openDialog() {
    setExternalPaymentId(suggestReference());
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const amount = Number(amountReais.replace(",", "."));
    const result = await recordManualPaymentAction({
      workspaceId,
      planId,
      amountCents: Number.isFinite(amount) ? Math.round(amount * 100) : 0,
      paymentMethod,
      externalPaymentId,
      periodStart,
      periodEnd,
      activateSubscription,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    toast.success("Pagamento registrado.");
    setOpen(false);
    setAmountReais("");
    router.refresh();
  }

  return (
    <>
      <Button onClick={openDialog} disabled={!canWrite}>
        <Plus className="size-4" />
        Lançar pagamento
      </Button>

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        title="Lançar pagamento manual"
        description="Para PIX, transferência ou acerto fora do gateway."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !workspaceId}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Registrar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <AdminField label="Workspace" error={fieldErrors.workspaceId?.[0]}>
            <AdminSelect
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name} (/{workspace.slug})
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Plano" error={fieldErrors.planId?.[0]}>
              <AdminSelect
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>

            <AdminField label="Valor (R$)" error={fieldErrors.amountCents?.[0]}>
              <AdminInput
                inputMode="decimal"
                value={amountReais}
                onChange={(event) => setAmountReais(event.target.value)}
                placeholder="99,00"
              />
            </AdminField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField
              label="Forma de pagamento"
              error={fieldErrors.paymentMethod?.[0]}
            >
              <AdminSelect
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
                <option value="cartao">Cartão</option>
                <option value="cortesia">Cortesia</option>
              </AdminSelect>
            </AdminField>

            <AdminField
              label="Referência"
              hint="Identificador único do lançamento."
              error={fieldErrors.externalPaymentId?.[0]}
            >
              <AdminInput
                value={externalPaymentId}
                onChange={(event) => setExternalPaymentId(event.target.value)}
              />
            </AdminField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Início do período">
              <AdminInput
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </AdminField>
            <AdminField
              label="Fim do período"
              error={fieldErrors.periodEnd?.[0]}
            >
              <AdminInput
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </AdminField>
          </div>

          <AdminSwitch
            checked={activateSubscription}
            onChange={setActivateSubscription}
            label="Ativar assinatura junto"
            description="Cria ou renova a assinatura do workspace com este período."
          />

          <AdminFormError message={error} />
        </div>
      </AdminDialog>
    </>
  );
}

export function AdminRefundButton({
  payment,
  canWrite,
}: {
  payment: AdminPaymentRow;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const disabled = !canWrite || payment.status !== "paid";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={`Reembolsar ${payment.externalPaymentId}`}
        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Undo2 className="size-3.5" />
      </button>

      <AdminConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Reembolsar pagamento"
        description={`${formatCents(payment.amountCents)} de "${payment.workspaceName}" será marcado como reembolsado e a assinatura correspondente será ajustada.`}
        confirmLabel="Reembolsar"
        successMessage="Pagamento reembolsado."
        destructive
        onConfirm={() => refundPaymentAction({ paymentId: payment.id })}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
