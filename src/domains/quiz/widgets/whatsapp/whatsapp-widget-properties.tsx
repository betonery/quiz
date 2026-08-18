"use client";

import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { WhatsappWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  buildWhatsAppUrl,
  normalizePhoneNumber,
  resolveWhatsAppColors,
} from "@/domains/quiz/utils/whatsapp-widget.utils";
import { extractVariableKeys } from "@/domains/quiz/utils/variable-template.utils";

type WhatsappWidgetPropertiesProps = {
  config: WhatsappWidgetConfig;
  onChange: (config: WhatsappWidgetConfig) => void;
};

export function WhatsappWidgetProperties({
  config,
  onChange,
}: WhatsappWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const variables = useBuilderStore((s) => s.variables);
  const resolvedColors = resolveWhatsAppColors(config, design);

  function patch(partial: Partial<WhatsappWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  const previewVariables = Object.fromEntries(
    extractVariableKeys(config.message).map((key) => {
      const item = variables.find((variable) => variable.key === key);
      return [key, item?.label ?? key];
    }),
  );

  const previewUrl = buildWhatsAppUrl(
    config.phoneNumber,
    config.message,
    previewVariables,
  );

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Telefone (WhatsApp)">
          <Input
            value={config.phoneNumber}
            onChange={(event) =>
              patch({ phoneNumber: normalizePhoneNumber(event.target.value) })
            }
            placeholder="11999999999"
            className="bg-background shadow-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Apenas números. Ex.: (11) 99999-9999
          </p>
        </PropertyField>
        <PropertyField label="Mensagem">
          <VariableInsertField
            value={config.message}
            onChange={(message) => patch({ message })}
            multiline
          />
        </PropertyField>
        <PropertyField label="Texto do botão">
          <VariableInsertField
            value={config.buttonLabel}
            onChange={(buttonLabel) => patch({ buttonLabel })}
          />
        </PropertyField>
        <PropertyField label="Abrir em nova aba">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.openInNewTab}
              onChange={(event) =>
                patch({ openInNewTab: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
        <PropertyField label="Mostrar ícone">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showIcon}
              onChange={(event) => patch({ showIcon: event.target.checked })}
            />
            Sim
          </label>
        </PropertyField>
        {previewUrl ? (
          <p className="text-xs text-muted-foreground">
            URL:{" "}
            <span className="break-all font-mono text-foreground">
              {previewUrl}
            </span>
          </p>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Fundo"
            value={resolvedColors.background}
            onChange={(backgroundColor) => patch({ backgroundColor })}
            onReset={() => patch({ backgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Texto"
            value={resolvedColors.text}
            onChange={(textColor) => patch({ textColor })}
            onReset={() => patch({ textColor: null })}
          />
          <PropertyColorSwatchReset
            label="Ícone"
            value={resolvedColors.icon}
            onChange={(iconColor) => patch({ iconColor })}
            onReset={() => patch({ iconColor: null })}
          />
        </div>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
