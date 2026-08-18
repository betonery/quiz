"use client";

import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { AlertWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { AlertVariant } from "@/domains/quiz/types/media.types";
import {
  getAlertPresetCopy,
  resolveAlertColors,
} from "@/domains/quiz/utils/alert-widget.utils";

type AlertWidgetPropertiesProps = {
  config: AlertWidgetConfig;
  onChange: (config: AlertWidgetConfig) => void;
};

export function AlertWidgetProperties({
  config,
  onChange,
}: AlertWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveAlertColors(config, design);

  function patch(partial: Partial<AlertWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function applyVariant(variant: AlertVariant) {
    const copy = getAlertPresetCopy(variant);
    patch({
      variant,
      title: copy.title,
      body: copy.body,
      icon: null,
    });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Variante">
          <PropertySelect
            value={config.variant}
            onChange={(value) => applyVariant(value as AlertVariant)}
          >
            <option value="info">Informação</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="promo">Promoção</option>
          </PropertySelect>
        </PropertyField>
        <PropertyField label="Título">
          <VariableInsertField
            value={config.title}
            onChange={(title) => patch({ title })}
          />
        </PropertyField>
        <PropertyField label="Corpo">
          <VariableInsertField
            value={config.body}
            onChange={(body) => patch({ body })}
            multiline
          />
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
        {config.showIcon ? (
          <PropertyField label="Ícone">
            <PropertySelect
              value={config.icon ?? ""}
              onChange={(icon) =>
                patch({
                  icon: icon ? (icon as AlertWidgetConfig["icon"]) : null,
                })
              }
            >
              <option value="">Preset da variante</option>
              <option value="info">Info</option>
              <option value="check">Check</option>
              <option value="alert">Alerta</option>
              <option value="gift">Presente</option>
            </PropertySelect>
          </PropertyField>
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
            label="Borda"
            value={resolvedColors.border}
            onChange={(borderColor) => patch({ borderColor })}
            onReset={() => patch({ borderColor: null })}
          />
          <PropertyColorSwatchReset
            label="Título"
            value={resolvedColors.title}
            onChange={(titleColor) => patch({ titleColor })}
            onReset={() => patch({ titleColor: null })}
          />
          <PropertyColorSwatchReset
            label="Corpo"
            value={resolvedColors.body}
            onChange={(bodyColor) => patch({ bodyColor })}
            onReset={() => patch({ bodyColor: null })}
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
