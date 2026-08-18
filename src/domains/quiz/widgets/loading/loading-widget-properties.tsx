"use client";

import { Input } from "@/components/ui/input";
import type { LoadingWidgetConfig } from "@/domains/quiz/types/builder.types";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import {
  clampLoadingDuration,
  clampLoadingLimitPercent,
  resolveLoadingColors,
} from "@/domains/quiz/utils/loading-widget.utils";

type LoadingWidgetPropertiesProps = {
  config: LoadingWidgetConfig;
  onChange: (config: LoadingWidgetConfig) => void;
};

export function LoadingWidgetProperties({
  config,
  onChange,
}: LoadingWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveLoadingColors(config, design);

  function patch(partial: Partial<LoadingWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Progresso">
        <PropertyField label="Duração (segundos)">
          <Input
            type="number"
            min={1}
            max={120}
            value={config.durationSeconds}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              patch({ durationSeconds: clampLoadingDuration(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyField label="Limite (%)">
          <Input
            type="number"
            min={0}
            max={100}
            value={config.limitPercent}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              patch({ limitPercent: clampLoadingLimitPercent(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <PropertyField label="Título">
          <VariableInsertField
            value={config.title}
            onChange={(title) => patch({ title })}
            placeholder="Carregando..."
          />
        </PropertyField>
        <PropertyField label="Descrição">
          <VariableInsertField
            value={config.description}
            onChange={(description) => patch({ description })}
            placeholder="Lorem ipsum dolor sit amet."
          />
        </PropertyField>
        <PropertyCheckbox
          label="Mostrar Título"
          checked={config.showTitle}
          onChange={(showTitle) => patch({ showTitle })}
        />
        <PropertyCheckbox
          label="Mostrar Progresso"
          checked={config.showMeter}
          onChange={(showMeter) => patch({ showMeter })}
        />
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Cor"
            value={resolvedColors.fill}
            onChange={(fillColor) => patch({ fillColor })}
            onReset={() => patch({ fillColor: null })}
          />
          <PropertyColorSwatchReset
            label="Texto"
            value={resolvedColors.text}
            onChange={(textColor) => patch({ textColor })}
            onReset={() => patch({ textColor: null })}
          />
          <PropertyColorSwatchReset
            label="Track"
            value={resolvedColors.track}
            onChange={(trackColor) => patch({ trackColor })}
            onReset={() => patch({ trackColor: null })}
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
