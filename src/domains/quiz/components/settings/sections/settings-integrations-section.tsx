"use client";

import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyField,
  propertyFieldDarkClass,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";

export function SettingsIntegrationsSection() {
  const settings = useBuilderStore((s) => s.settings);
  const updateSettings = useBuilderStore((s) => s.updateSettings);

  const metaPixel = settings.integrations.metaPixel ?? {
    enabled: false,
    pixelId: "",
  };

  const utmify = settings.integrations.utmify ?? {
    enabled: false,
    utmScriptEnabled: true,
    pixelId: "",
  };

  return (
    <div className="space-y-4">
      <PropertiesSection title="Meta Pixel" variant="dark">
        <PropertyCheckbox
          label="Ativar Meta Pixel"
          checked={metaPixel.enabled}
          onChange={(checked) =>
            updateSettings({
              integrations: {
                metaPixel: { ...metaPixel, enabled: checked },
              },
            })
          }
        />
        {metaPixel.enabled ? (
          <PropertyField label="Pixel ID" variant="dark">
            <Input
              value={metaPixel.pixelId}
              onChange={(e) =>
                updateSettings({
                  integrations: {
                    metaPixel: {
                      ...metaPixel,
                      pixelId: e.target.value.replace(/\D/g, ""),
                    },
                  },
                })
              }
              placeholder="123456789012345"
              className={propertyFieldDarkClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Dispara PageView ao abrir o funil e Lead ao concluir ou
              redirecionar.
            </p>
          </PropertyField>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="UTMify" variant="dark">
        <PropertyCheckbox
          label="Ativar UTMify"
          checked={utmify.enabled}
          onChange={(checked) =>
            updateSettings({
              integrations: {
                utmify: { ...utmify, enabled: checked },
              },
            })
          }
        />
        {utmify.enabled ? (
          <>
            <PropertyCheckbox
              label="Script de UTMs (recomendado)"
              checked={utmify.utmScriptEnabled}
              onChange={(checked) =>
                updateSettings({
                  integrations: {
                    utmify: { ...utmify, utmScriptEnabled: checked },
                  },
                })
              }
            />
            <PropertyField label="Pixel ID UTMify (opcional)" variant="dark">
              <Input
                value={utmify.pixelId ?? ""}
                onChange={(e) =>
                  updateSettings({
                    integrations: {
                      utmify: {
                        ...utmify,
                        pixelId: e.target.value.trim(),
                      },
                    },
                  })
                }
                placeholder="ID do pixel no painel UTMify"
                className={propertyFieldDarkClass}
              />
            </PropertyField>
            <p className="text-xs text-slate-400">
              O script de UTMs preserva parâmetros de campanha ao longo do
              funil. Copie os scripts no painel da UTMify se precisar de
              configuração avançada.
            </p>
          </>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Prévia" variant="dark">
        <PropertyCheckbox
          label="Testar integrações na prévia (?preview=1)"
          checked={settings.testIntegrationsInPreview ?? false}
          onChange={(checked) =>
            updateSettings({ testIntegrationsInPreview: checked })
          }
        />
        <p className="text-xs text-slate-400">
          Por padrão, scripts não rodam na prévia para evitar poluir analytics.
        </p>
      </PropertiesSection>
    </div>
  );
}
