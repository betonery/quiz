"use client";

import { Input } from "@/components/ui/input";
import type { LevelWidgetConfig } from "@/domains/quiz/types/builder.types";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import {
  clampLevelPercentage,
  resolveLevelColors,
} from "@/domains/quiz/utils/level-widget.utils";

type LevelWidgetPropertiesProps = {
  config: LevelWidgetConfig;
  onChange: (config: LevelWidgetConfig) => void;
};

export function LevelWidgetProperties({
  config,
  onChange,
}: LevelWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveLevelColors(config, design);

  function patch(partial: Partial<LevelWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Comportamento">
        <PropertyField label="Título">
          <VariableInsertField
            value={config.title}
            onChange={(title) => patch({ title })}
            placeholder="Nível"
          />
        </PropertyField>
        <PropertyField label="Subtítulo">
          <VariableInsertField
            value={config.subtitle}
            onChange={(subtitle) => patch({ subtitle })}
            placeholder="Lorem ipsum"
          />
        </PropertyField>
        <PropertyField label="Porcentagem">
          <Input
            type="number"
            min={0}
            max={100}
            value={config.percentage}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isFinite(next)) return;
              patch({ percentage: clampLevelPercentage(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyField label="Texto do Indicador">
          <VariableInsertField
            value={config.indicatorText}
            onChange={(indicatorText) => patch({ indicatorText })}
            placeholder="Você está aqui"
          />
        </PropertyField>
        <PropertyField label="Legendas (separado por vírgula)">
          <VariableInsertField
            value={config.legends}
            onChange={(legends) => patch({ legends })}
            placeholder="Começando,Inicio,Médio,Alto,Muito alto"
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Layout">
        <PropertyField label="Espaçamento">
          <PropertySelect
            value={config.spacing}
            onChange={(spacing) =>
              patch({ spacing: spacing as LevelWidgetConfig["spacing"] })
            }
          >
            <option value="none">Nenhum</option>
            <option value="sm">Pequeno</option>
            <option value="md">Normal</option>
            <option value="lg">Grande</option>
          </PropertySelect>
        </PropertyField>
        <PropertyCheckbox
          label="Mostrar Medidor"
          checked={config.showMeter}
          onChange={(showMeter) => patch({ showMeter })}
        />
        <PropertyCheckbox
          label="Mostrar Progresso"
          checked={config.showProgress}
          onChange={(showProgress) => patch({ showProgress })}
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
            label="Borda"
            value={resolvedColors.border}
            onChange={(borderColor) => patch({ borderColor })}
            onReset={() => patch({ borderColor: null })}
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
