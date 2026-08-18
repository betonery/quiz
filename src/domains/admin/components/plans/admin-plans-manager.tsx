"use client";

import { Archive, Loader2, Pencil, Plus, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createPlanAction,
  setPlanActiveAction,
  updatePlanAction,
} from "@/domains/admin/actions/admin-plans.actions";
import { AdminConfirmDialog } from "@/domains/admin/components/ui/admin-confirm-dialog";
import { AdminDialog } from "@/domains/admin/components/ui/admin-dialog";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSwitch,
  AdminTextarea,
} from "@/domains/admin/components/ui/admin-form-fields";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminTableWrapper,
  AdminTd,
  AdminTh,
  AdminTr,
} from "@/domains/admin/components/ui/admin-primitives";
import { AdminTagsInput } from "@/domains/admin/components/ui/admin-tags-input";
import {
  EXTERNAL_REFERENCE_MAX_LENGTH,
  EXTERNAL_REFERENCES_MAX_ITEMS,
} from "@/domains/admin/schemas/admin-plan.schema";
import type { AdminPlanRow } from "@/domains/admin/types/admin.types";
import { formatCents } from "@/domains/admin/utils/admin-format.utils";
import { useToast } from "@/hooks/use-toast";

type FormState = {
  id: string;
  name: string;
  description: string;
  maxQuizzes: string;
  maxTeamMembers: string;
  maxCustomDomains: string;
  priceReais: string;
  checkoutUrl: string;
  externalReferences: string[];
  isActive: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  description: "",
  maxQuizzes: "10",
  maxTeamMembers: "3",
  maxCustomDomains: "1",
  priceReais: "0",
  checkoutUrl: "",
  externalReferences: [],
  isActive: true,
  sortOrder: "0",
};

function planToForm(plan: AdminPlanRow): FormState {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? "",
    maxQuizzes: String(plan.limits.max_quizzes),
    maxTeamMembers: String(plan.limits.max_team_members),
    maxCustomDomains: String(plan.limits.max_custom_domains),
    priceReais: plan.priceCents === null ? "" : String(plan.priceCents / 100),
    checkoutUrl: plan.checkoutUrl ?? "",
    externalReferences: plan.externalReferences,
    isActive: plan.isActive,
    sortOrder: String(plan.sortOrder),
  };
}

/** O formulário trabalha em reais; o banco guarda centavos. */
function reaisToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

function formatLimit(value: number): string {
  return value === -1 ? "Ilimitado" : String(value);
}

export function AdminPlansManager({
  plans,
  canWrite,
}: {
  plans: AdminPlanRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlanRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [archiveTarget, setArchiveTarget] = useState<AdminPlanRow | null>(null);

  function openCreate() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setError(null);
    setFieldErrors({});
    setDialogOpen(true);
  }

  function openEdit(plan: AdminPlanRow) {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setError(null);
    setFieldErrors({});
    setDialogOpen(true);
  }

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      name: form.name,
      description: form.description.trim() === "" ? null : form.description,
      maxQuizzes: Number(form.maxQuizzes),
      maxTeamMembers: Number(form.maxTeamMembers),
      maxCustomDomains: Number(form.maxCustomDomains),
      priceCents: reaisToCents(form.priceReais),
      checkoutUrl: form.checkoutUrl.trim() === "" ? null : form.checkoutUrl,
      externalReferences: form.externalReferences,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    };

    const result = editingPlan
      ? await updatePlanAction(editingPlan.id, payload)
      : await createPlanAction({ ...payload, id: form.id });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    toast.success(editingPlan ? "Plano atualizado." : "Plano criado.");
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} disabled={!canWrite}>
          <Plus className="size-4" />
          Novo plano
        </Button>
      </div>

      <AdminCard>
        {plans.length === 0 ? (
          <AdminEmpty
            title="Nenhum plano cadastrado"
            description="Crie o primeiro plano para liberar assinaturas."
          />
        ) : (
          <AdminTableWrapper>
            <thead>
              <tr>
                <AdminTh>Plano</AdminTh>
                <AdminTh className="text-right">Preço</AdminTh>
                <AdminTh className="text-right">Funis</AdminTh>
                <AdminTh className="text-right">Membros</AdminTh>
                <AdminTh className="text-right">Domínios</AdminTh>
                <AdminTh className="text-right">Assinantes</AdminTh>
                <AdminTh>Situação</AdminTh>
                <AdminTh />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <AdminTr key={plan.id}>
                  <AdminTd>
                    <p className="font-medium text-slate-200">{plan.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {plan.id}
                      {plan.externalReferences.length > 0 ? (
                        <span
                          className="text-slate-600"
                          title={plan.externalReferences.join(", ")}
                        >
                          {" · "}
                          {plan.externalReferences.length} ref.
                        </span>
                      ) : null}
                    </p>
                  </AdminTd>
                  <AdminTd className="text-right tabular-nums">
                    {formatCents(plan.priceCents)}
                  </AdminTd>
                  <AdminTd className="text-right">
                    {formatLimit(plan.limits.max_quizzes)}
                  </AdminTd>
                  <AdminTd className="text-right">
                    {formatLimit(plan.limits.max_team_members)}
                  </AdminTd>
                  <AdminTd className="text-right">
                    {formatLimit(plan.limits.max_custom_domains)}
                  </AdminTd>
                  <AdminTd className="text-right tabular-nums">
                    {plan.activeSubscriberCount}
                    <span className="text-slate-600">
                      {" "}
                      / {plan.subscriberCount}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    {plan.isActive ? (
                      <AdminBadge tone="success">Ativo</AdminBadge>
                    ) : (
                      <AdminBadge tone="neutral">Arquivado</AdminBadge>
                    )}
                  </AdminTd>
                  <AdminTd>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        disabled={!canWrite}
                        aria-label={`Editar ${plan.name}`}
                        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(plan)}
                        disabled={!canWrite}
                        aria-label={`${plan.isActive ? "Arquivar" : "Reativar"} ${plan.name}`}
                        className="flex size-7 items-center justify-center rounded-lg border border-slate-700/70 text-slate-400 transition-colors hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {plan.isActive ? (
                          <Archive className="size-3.5" />
                        ) : (
                          <Undo2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </tbody>
          </AdminTableWrapper>
        )}
      </AdminCard>

      <AdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingPlan ? `Editar ${editingPlan.name}` : "Novo plano"}
        description="Use -1 em qualquer limite para deixá-lo ilimitado."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {editingPlan ? "Salvar alterações" : "Criar plano"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField
              label="Identificador"
              hint={
                editingPlan
                  ? "Imutável: assinaturas e pagamentos apontam para ele."
                  : "Ex.: starter, pro, enterprise"
              }
              error={fieldErrors.id?.[0]}
            >
              <AdminInput
                value={form.id}
                disabled={editingPlan !== null}
                onChange={(event) => patch({ id: event.target.value })}
                placeholder="starter"
              />
            </AdminField>

            <AdminField label="Nome" error={fieldErrors.name?.[0]}>
              <AdminInput
                value={form.name}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder="Starter"
              />
            </AdminField>
          </div>

          <AdminField label="Descrição" error={fieldErrors.description?.[0]}>
            <AdminTextarea
              value={form.description}
              maxLength={300}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="Ideal para começar com funis interativos."
            />
          </AdminField>

          <div className="grid gap-3 sm:grid-cols-3">
            <AdminField label="Funis" error={fieldErrors.maxQuizzes?.[0]}>
              <AdminInput
                type="number"
                value={form.maxQuizzes}
                onChange={(event) => patch({ maxQuizzes: event.target.value })}
              />
            </AdminField>
            <AdminField label="Membros" error={fieldErrors.maxTeamMembers?.[0]}>
              <AdminInput
                type="number"
                value={form.maxTeamMembers}
                onChange={(event) =>
                  patch({ maxTeamMembers: event.target.value })
                }
              />
            </AdminField>
            <AdminField
              label="Domínios"
              error={fieldErrors.maxCustomDomains?.[0]}
            >
              <AdminInput
                type="number"
                value={form.maxCustomDomains}
                onChange={(event) =>
                  patch({ maxCustomDomains: event.target.value })
                }
              />
            </AdminField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField
              label="Preço mensal (R$)"
              hint="Deixe vazio para plano sem cobrança."
              error={fieldErrors.priceCents?.[0]}
            >
              <AdminInput
                type="text"
                inputMode="decimal"
                value={form.priceReais}
                onChange={(event) => patch({ priceReais: event.target.value })}
                placeholder="99,00"
              />
            </AdminField>

            <AdminField label="Ordem" error={fieldErrors.sortOrder?.[0]}>
              <AdminInput
                type="number"
                value={form.sortOrder}
                onChange={(event) => patch({ sortOrder: event.target.value })}
              />
            </AdminField>
          </div>

          <AdminField
            label="URL de checkout"
            hint="Link externo de pagamento."
            error={fieldErrors.checkoutUrl?.[0]}
          >
            <AdminInput
              value={form.checkoutUrl}
              onChange={(event) => patch({ checkoutUrl: event.target.value })}
              placeholder="https://..."
            />
          </AdminField>

          <AdminField
            label="Referências externas"
            hint="Códigos que identificam este plano nas plataformas de pagamento. Quando um evento de compra chegar com um destes códigos, este plano é liberado. Enter, vírgula ou colar várias linhas adiciona."
            error={fieldErrors.externalReferences?.[0]}
          >
            <AdminTagsInput
              value={form.externalReferences}
              onChange={(next) => patch({ externalReferences: next })}
              maxTags={EXTERNAL_REFERENCES_MAX_ITEMS}
              maxLength={EXTERNAL_REFERENCE_MAX_LENGTH}
              placeholder="ex.: price_1A2B3C, kiwify-9f8e7d"
            />
          </AdminField>

          <AdminSwitch
            checked={form.isActive}
            onChange={(checked) => patch({ isActive: checked })}
            label="Plano ativo"
            description="Planos inativos não aparecem para os clientes."
          />

          <AdminFormError message={error} />
        </div>
      </AdminDialog>

      <AdminConfirmDialog
        open={archiveTarget !== null}
        onOpenChange={() => setArchiveTarget(null)}
        title={archiveTarget?.isActive ? "Arquivar plano" : "Reativar plano"}
        description={
          archiveTarget?.isActive
            ? `"${archiveTarget?.name}" deixa de aparecer para novos clientes. O histórico é preservado.`
            : `"${archiveTarget?.name}" volta a ficar disponível para contratação.`
        }
        confirmLabel={archiveTarget?.isActive ? "Arquivar" : "Reativar"}
        successMessage="Plano atualizado."
        onConfirm={() =>
          setPlanActiveAction(
            archiveTarget?.id ?? "",
            !(archiveTarget?.isActive ?? true),
          )
        }
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
