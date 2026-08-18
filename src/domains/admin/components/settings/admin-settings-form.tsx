"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePlatformSettingsAction } from "@/domains/admin/actions/admin-settings.actions";
import {
  AdminField,
  AdminFormError,
  AdminInput,
  AdminSelect,
  AdminSwitch,
  AdminTextarea,
} from "@/domains/admin/components/ui/admin-form-fields";
import {
  AdminCard,
  AdminCardHeader,
} from "@/domains/admin/components/ui/admin-primitives";
import type {
  AdminPlanRow,
  AdminPlatformSettings,
} from "@/domains/admin/types/admin.types";
import { useToast } from "@/hooks/use-toast";

export function AdminSettingsForm({
  settings,
  plans,
  canWrite,
}: {
  settings: AdminPlatformSettings;
  plans: AdminPlanRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    signupsEnabled: settings.signupsEnabled,
    signupsDisabledMessage: settings.signupsDisabledMessage,
    globalAnnouncement: settings.globalAnnouncement ?? "",
    defaultPlanId: settings.defaultPlanId ?? "",
    trialDays: String(settings.trialDays),
    supportEmail: settings.supportEmail ?? "",
    productName: settings.productName,
    productDescription: settings.productDescription,
    logoUrl: settings.logoUrl ?? "",
    faviconUrl: settings.faviconUrl ?? "",
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    landingHeadline: settings.landingHeadline,
    landingSubheadline: settings.landingSubheadline,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function patch(next: Partial<typeof form>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const result = await updatePlatformSettingsAction({
      maintenanceMode: form.maintenanceMode,
      maintenanceMessage: form.maintenanceMessage,
      signupsEnabled: form.signupsEnabled,
      signupsDisabledMessage: form.signupsDisabledMessage,
      globalAnnouncement: form.globalAnnouncement,
      defaultPlanId: form.defaultPlanId,
      trialDays: Number(form.trialDays),
      supportEmail: form.supportEmail,
      productName: form.productName,
      productDescription: form.productDescription,
      logoUrl: form.logoUrl,
      faviconUrl: form.faviconUrl,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor,
      landingHeadline: form.landingHeadline,
      landingSubheadline: form.landingSubheadline,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    toast.success("Configurações salvas.");
    router.refresh();
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <AdminCard>
        <AdminCardHeader
          title="Marca"
          description="Personalize o nome, logo, cores e o hero da landing sem alterar código."
        />
        <div className="flex flex-col gap-4 px-5 py-4">
          <AdminField
            label="Nome do produto"
            error={fieldErrors.productName?.[0]}
          >
            <AdminInput
              value={form.productName}
              disabled={!canWrite}
              maxLength={80}
              onChange={(event) => patch({ productName: event.target.value })}
              placeholder="Quiz Platform"
            />
          </AdminField>

          <AdminField
            label="Descrição (SEO)"
            error={fieldErrors.productDescription?.[0]}
          >
            <AdminTextarea
              value={form.productDescription}
              disabled={!canWrite}
              maxLength={300}
              onChange={(event) =>
                patch({ productDescription: event.target.value })
              }
            />
          </AdminField>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="URL do logo"
              hint="Deixe vazio para usar o monograma do nome."
              error={fieldErrors.logoUrl?.[0]}
            >
              <AdminInput
                type="url"
                value={form.logoUrl}
                disabled={!canWrite}
                onChange={(event) => patch({ logoUrl: event.target.value })}
                placeholder="https://..."
              />
            </AdminField>

            <AdminField
              label="URL do favicon"
              error={fieldErrors.faviconUrl?.[0]}
            >
              <AdminInput
                type="url"
                value={form.faviconUrl}
                disabled={!canWrite}
                onChange={(event) => patch({ faviconUrl: event.target.value })}
                placeholder="https://..."
              />
            </AdminField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Cor primária"
              error={fieldErrors.primaryColor?.[0]}
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  disabled={!canWrite}
                  onChange={(event) =>
                    patch({ primaryColor: event.target.value.toUpperCase() })
                  }
                  className="size-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <AdminInput
                  value={form.primaryColor}
                  disabled={!canWrite}
                  onChange={(event) =>
                    patch({ primaryColor: event.target.value })
                  }
                  placeholder="#0F172A"
                />
              </div>
            </AdminField>

            <AdminField
              label="Cor secundária (CTA)"
              error={fieldErrors.secondaryColor?.[0]}
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryColor}
                  disabled={!canWrite}
                  onChange={(event) =>
                    patch({ secondaryColor: event.target.value.toUpperCase() })
                  }
                  className="size-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <AdminInput
                  value={form.secondaryColor}
                  disabled={!canWrite}
                  onChange={(event) =>
                    patch({ secondaryColor: event.target.value })
                  }
                  placeholder="#3B82F6"
                />
              </div>
            </AdminField>
          </div>

          <AdminField
            label="Headline da landing"
            error={fieldErrors.landingHeadline?.[0]}
          >
            <AdminTextarea
              value={form.landingHeadline}
              disabled={!canWrite}
              maxLength={200}
              onChange={(event) =>
                patch({ landingHeadline: event.target.value })
              }
            />
          </AdminField>

          <AdminField
            label="Subheadline da landing"
            error={fieldErrors.landingSubheadline?.[0]}
          >
            <AdminTextarea
              value={form.landingSubheadline}
              disabled={!canWrite}
              maxLength={300}
              onChange={(event) =>
                patch({ landingSubheadline: event.target.value })
              }
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader
          title="Disponibilidade"
          description="Controla o acesso de todos os usuários à plataforma."
        />
        <div className="flex flex-col gap-4 px-5 py-4">
          <AdminSwitch
            checked={form.maintenanceMode}
            disabled={!canWrite}
            onChange={(checked) => patch({ maintenanceMode: checked })}
            label="Modo manutenção"
            description="Bloqueia o dashboard para usuários comuns. O painel administrativo e os funis publicados continuam acessíveis."
          />

          <AdminField
            label="Mensagem de manutenção"
            error={fieldErrors.maintenanceMessage?.[0]}
          >
            <AdminTextarea
              value={form.maintenanceMessage}
              disabled={!canWrite}
              maxLength={300}
              onChange={(event) =>
                patch({ maintenanceMessage: event.target.value })
              }
            />
          </AdminField>

          <AdminSwitch
            checked={form.signupsEnabled}
            disabled={!canWrite}
            onChange={(checked) => patch({ signupsEnabled: checked })}
            label="Cadastros abertos"
            description="Desligue para impedir novos registros sem tirar o site do ar."
          />

          <AdminField
            label="Mensagem com cadastros fechados"
            error={fieldErrors.signupsDisabledMessage?.[0]}
          >
            <AdminTextarea
              value={form.signupsDisabledMessage}
              disabled={!canWrite}
              maxLength={300}
              onChange={(event) =>
                patch({ signupsDisabledMessage: event.target.value })
              }
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader
          title="Comunicação"
          description="Avisos exibidos dentro do app."
        />
        <div className="flex flex-col gap-4 px-5 py-4">
          <AdminField
            label="Aviso global"
            hint="Deixe vazio para não exibir nenhum aviso."
            error={fieldErrors.globalAnnouncement?.[0]}
          >
            <AdminTextarea
              value={form.globalAnnouncement}
              disabled={!canWrite}
              maxLength={300}
              onChange={(event) =>
                patch({ globalAnnouncement: event.target.value })
              }
              placeholder="Ex.: Manutenção programada no domingo às 2h."
            />
          </AdminField>

          <AdminField
            label="E-mail de suporte"
            error={fieldErrors.supportEmail?.[0]}
          >
            <AdminInput
              type="email"
              value={form.supportEmail}
              disabled={!canWrite}
              onChange={(event) => patch({ supportEmail: event.target.value })}
              placeholder="suporte@dominio.com"
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader
          title="Novos cadastros"
          description="O que acontece quando alguém cria uma conta."
        />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <AdminField
            label="Plano padrão"
            hint="Aplicado a novos workspaces junto com o período de teste."
            error={fieldErrors.defaultPlanId?.[0]}
          >
            <AdminSelect
              value={form.defaultPlanId}
              disabled={!canWrite}
              onChange={(event) => patch({ defaultPlanId: event.target.value })}
            >
              <option value="">Nenhum</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>

          <AdminField
            label="Dias de teste"
            hint="0 desativa o período de teste."
            error={fieldErrors.trialDays?.[0]}
          >
            <AdminInput
              type="number"
              min={0}
              max={365}
              value={form.trialDays}
              disabled={!canWrite}
              onChange={(event) => patch({ trialDays: event.target.value })}
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminFormError message={error} />

      <div>
        <Button onClick={handleSubmit} disabled={!canWrite || saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Salvar configurações
        </Button>
      </div>
    </div>
  );
}
