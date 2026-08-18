"use client";

import { Eye, EyeOff, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { createUserAction } from "@/domains/admin/actions/admin-users.actions";
import { AdminDialog } from "@/domains/admin/components/ui/admin-dialog";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
} from "@/domains/admin/components/ui/admin-form-fields";
import type { AdminPlanRow } from "@/domains/admin/types/admin.types";
import { formatCents } from "@/domains/admin/utils/admin-format.utils";
import { useToast } from "@/hooks/use-toast";

/** Senha inicial forte o suficiente para não travar na validação de 8 chars. */
function generatePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

const EMPTY = {
  fullName: "",
  email: "",
  password: "",
  planId: "",
  accessDays: "30",
};

export function AdminCreateUserButton({
  plans,
  canWrite,
}: {
  plans: AdminPlanRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function patch(next: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function openDialog() {
    setForm({ ...EMPTY, password: generatePassword() });
    setShowPassword(true);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const result = await createUserAction({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      planId: form.planId,
      accessDays: Number(form.accessDays),
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    toast.success("Usuário criado.");
    setOpen(false);

    const userId = result.data?.userId;
    if (userId) {
      router.push(ROUTES.admin.user(userId));
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Button onClick={openDialog} disabled={!canWrite}>
        <UserPlus className="size-4" />
        Criar usuário
      </Button>

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        title="Criar usuário"
        description="A conta nasce com e-mail já confirmado — o usuário entra direto com a senha definida aqui."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Criar usuário
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <AdminField label="Nome" error={fieldErrors.fullName?.[0]}>
            <AdminInput
              value={form.fullName}
              maxLength={80}
              onChange={(event) => patch({ fullName: event.target.value })}
              placeholder="Maria Silva"
            />
          </AdminField>

          <AdminField label="E-mail" error={fieldErrors.email?.[0]}>
            <AdminInput
              type="email"
              value={form.email}
              autoComplete="off"
              onChange={(event) => patch({ email: event.target.value })}
              placeholder="maria@dominio.com"
            />
          </AdminField>

          <AdminField
            label="Senha"
            hint="Mínimo de 8 caracteres. Copie e envie ao usuário."
            error={fieldErrors.password?.[0]}
          >
            <div className="flex gap-2">
              <AdminInput
                type={showPassword ? "text" : "password"}
                value={form.password}
                autoComplete="new-password"
                onChange={(event) => patch({ password: event.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => patch({ password: generatePassword() })}
                aria-label="Gerar nova senha"
                title="Gerar nova senha"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
              >
                <RefreshCw className="size-4" />
              </button>
            </div>
          </AdminField>

          <div className="grid gap-3 sm:grid-cols-2">
            <AdminField label="Plano" error={fieldErrors.planId?.[0]}>
              <AdminSelect
                value={form.planId}
                onChange={(event) => patch({ planId: event.target.value })}
              >
                <option value="">Sem assinatura</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {formatCents(plan.priceCents)}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>

            <AdminField
              label="Dias de acesso"
              hint="Contados a partir de hoje."
              error={fieldErrors.accessDays?.[0]}
            >
              <AdminInput
                type="number"
                min={1}
                max={3650}
                value={form.accessDays}
                disabled={form.planId === ""}
                onChange={(event) => patch({ accessDays: event.target.value })}
              />
            </AdminField>
          </div>

          <AdminFormError message={error} />
        </div>
      </AdminDialog>
    </>
  );
}
