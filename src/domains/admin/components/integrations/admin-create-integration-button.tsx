"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { createIntegrationAction } from "@/domains/admin/actions/admin-integrations.actions";
import { AdminDialog } from "@/domains/admin/components/ui/admin-dialog";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
} from "@/domains/admin/components/ui/admin-form-fields";
import type { IntegrationKind } from "@/domains/admin/types/integration.types";
import { slugifyProvider } from "@/domains/admin/utils/integration.utils";
import { useToast } from "@/hooks/use-toast";

export function AdminCreateIntegrationButton() {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<IntegrationKind>("purchase");
  const [providerSlug, setProviderSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleNameChange(value: string) {
    setName(value);
    // O slug acompanha o nome até o admin editá-lo à mão.
    if (!slugTouched) setProviderSlug(slugifyProvider(value));
  }

  function openDialog() {
    setName("");
    setKind("purchase");
    setProviderSlug("");
    setSlugTouched(false);
    setError(null);
    setFieldErrors({});
    setOpen(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const result = await createIntegrationAction({
      name,
      kind,
      providerSlug: providerSlug || slugifyProvider(name),
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    toast.success("Integração criada.");
    setOpen(false);

    const id = result.data?.integrationId;
    if (id) router.push(ROUTES.admin.integration(id));
    else router.refresh();
  }

  return (
    <>
      <Button onClick={openDialog}>
        <Plus className="size-4" />
        Nova integração
      </Button>

      <AdminDialog
        open={open}
        onOpenChange={setOpen}
        title="Nova integração"
        description="Depois de criar, você recebe a URL para colar na plataforma de vendas."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Criar integração
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <AdminField label="Nome" error={fieldErrors.name?.[0]}>
            <AdminInput
              value={name}
              maxLength={80}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Kiwify — Curso de Tráfego"
            />
          </AdminField>

          <AdminField
            label="Tipo"
            hint={
              kind === "purchase"
                ? "Cria ou atualiza a conta do comprador e libera o plano."
                : "Retira o acesso do comprador cancelando o plano."
            }
          >
            <AdminSelect
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as IntegrationKind)
              }
            >
              <option value="purchase">Compra</option>
              <option value="refund">Reembolso</option>
            </AdminSelect>
          </AdminField>

          <AdminField
            label="Identificador da plataforma"
            hint="Use o MESMO valor na integração de compra e na de reembolso da mesma plataforma — é por ele que o reembolso reencontra o pagamento."
            error={fieldErrors.providerSlug?.[0]}
          >
            <AdminInput
              value={providerSlug}
              onChange={(event) => {
                setSlugTouched(true);
                setProviderSlug(event.target.value);
              }}
              placeholder="kiwify"
            />
          </AdminField>

          <AdminFormError message={error} />
        </div>
      </AdminDialog>
    </>
  );
}
