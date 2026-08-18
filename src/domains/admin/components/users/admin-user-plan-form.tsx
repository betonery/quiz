"use client";

import { CalendarPlus, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import {
  cancelSubscriptionAction,
  extendSubscriptionAction,
  grantSubscriptionAction,
} from "@/domains/admin/actions/admin-subscriptions.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
} from "@/domains/admin/components/ui/admin-form-fields";
import {
  AdminBadge,
  AdminCard,
  AdminCardHeader,
  statusTone,
} from "@/domains/admin/components/ui/admin-primitives";
import { SUBSCRIPTION_STATUS_LABELS } from "@/domains/admin/constants/admin.constants";
import type {
  AdminPlanRow,
  AdminUserWorkspaceSummary,
} from "@/domains/admin/types/admin.types";
import { formatCents } from "@/domains/admin/utils/admin-format.utils";
import type { SubscriptionStatus } from "@/domains/billing/types/plan.types";
import { useToast } from "@/hooks/use-toast";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inOneMonthIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

type Props = {
  workspaces: AdminUserWorkspaceSummary[];
  plans: AdminPlanRow[];
  canWrite: boolean;
};

/**
 * O "plano do usuário" é, na prática, a assinatura do workspace que ele possui.
 * Quando há mais de um, o admin escolhe qual está editando.
 */
export function AdminUserPlanForm({ workspaces, plans, canWrite }: Props) {
  const owned = workspaces.filter((workspace) => workspace.isOwner);
  const [selectedId, setSelectedId] = useState(owned[0]?.id ?? "");

  if (owned.length === 0) {
    return (
      <AdminCard>
        <AdminCardHeader title="Plano" />
        <p className="px-5 py-4 text-sm text-slate-400">
          Este usuário não é proprietário de nenhum workspace, então não possui
          assinatura própria. O plano é definido no workspace de quem o
          convidou.
        </p>
      </AdminCard>
    );
  }

  const selected =
    owned.find((workspace) => workspace.id === selectedId) ?? owned[0];

  return (
    <AdminCard>
      <AdminCardHeader
        title="Plano"
        description="Assinatura do workspace deste usuário."
        action={
          selected.subscriptionStatus ? (
            <AdminBadge tone={statusTone(selected.subscriptionStatus)}>
              {SUBSCRIPTION_STATUS_LABELS[selected.subscriptionStatus] ??
                selected.subscriptionStatus}
            </AdminBadge>
          ) : (
            <AdminBadge tone="neutral">Sem assinatura</AdminBadge>
          )
        }
      />

      <div className="flex flex-col gap-3 px-5 py-4">
        {owned.length > 1 ? (
          <AdminField
            label="Workspace"
            hint="Este usuário possui mais de um workspace."
          >
            <AdminSelect
              value={selected.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {owned.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        ) : null}

        {/* key: troca de workspace remonta o form com os valores daquele. */}
        <PlanEditor
          key={selected.id}
          workspace={selected}
          plans={plans}
          canWrite={canWrite}
        />
      </div>
    </AdminCard>
  );
}

function PlanEditor({
  workspace,
  plans,
  canWrite,
}: {
  workspace: AdminUserWorkspaceSummary;
  plans: AdminPlanRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [planId, setPlanId] = useState(workspace.planId ?? plans[0]?.id ?? "");
  const [status, setStatus] = useState<SubscriptionStatus>(
    workspace.subscriptionStatus ?? "active",
  );
  const [periodStart, setPeriodStart] = useState(
    workspace.currentPeriodStart?.slice(0, 10) ?? todayIso(),
  );
  const [periodEnd, setPeriodEnd] = useState(
    workspace.currentPeriodEnd?.slice(0, 10) ?? inOneMonthIso(),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const result = await grantSubscriptionAction({
      workspaceId: workspace.id,
      planId,
      status,
      periodStart,
      periodEnd,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    toast.success("Plano atualizado.");
    router.refresh();
  }

  async function handleExtend() {
    setExtending(true);
    const result = await extendSubscriptionAction({
      workspaceId: workspace.id,
      days: extendDays,
    });
    setExtending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Acesso estendido em ${extendDays} dia(s).`);
    router.refresh();
  }

  return (
    <>
      <AdminField label="Plano" error={fieldErrors.planId?.[0]}>
        <AdminSelect
          value={planId}
          disabled={!canWrite}
          onChange={(event) => setPlanId(event.target.value)}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — {formatCents(plan.priceCents)}
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
            setStatus(event.target.value as SubscriptionStatus)
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
        <AdminField label="Fim" error={fieldErrors.periodEnd?.[0]}>
          <AdminInput
            type="date"
            value={periodEnd}
            disabled={!canWrite}
            onChange={(event) => setPeriodEnd(event.target.value)}
          />
        </AdminField>
      </div>

      <AdminFormError message={error} />

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSave} disabled={!canWrite || saving || !planId}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar plano
        </Button>

        {workspace.subscriptionStatus ? (
          <Button
            variant="outline"
            onClick={() => setCancelOpen(true)}
            disabled={!canWrite}
          >
            Cancelar assinatura
          </Button>
        ) : null}
      </div>

      {workspace.subscriptionStatus ? (
        <div className="flex items-end gap-2 border-t border-slate-800 pt-3">
          <AdminField label="Estender (dias)" className="w-32">
            <AdminInput
              type="number"
              min={1}
              max={3650}
              value={extendDays}
              disabled={!canWrite}
              onChange={(event) => setExtendDays(Number(event.target.value))}
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

      <Link
        href={ROUTES.admin.workspace(workspace.id)}
        className="text-xs text-cyan-400 hover:underline"
      >
        Abrir o workspace {workspace.name}
      </Link>

      <AdminConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar assinatura"
        description={`Os funis publicados de "${workspace.name}" saem do ar enquanto a assinatura estiver cancelada.`}
        confirmLabel="Cancelar assinatura"
        successMessage="Assinatura cancelada."
        destructive
        onConfirm={() =>
          cancelSubscriptionAction({ workspaceId: workspace.id })
        }
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
