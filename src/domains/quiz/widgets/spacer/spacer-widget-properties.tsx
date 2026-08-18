"use client";

import { Input } from "@/components/ui/input";
import type { SpacerWidgetConfig } from "@/domains/quiz/types/builder.types";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import {
  clampSpacerHeight,
  getSpacerColorPickerValue,
} from "@/domains/quiz/utils/spacer-widget.utils";

type SpacerWidgetPropertiesProps = {
  config: SpacerWidgetConfig;
  onChange: (config: SpacerWidgetConfig) => void;
};

export function SpacerWidgetProperties({
  config,
  onChange,
}: SpacerWidgetPropertiesProps) {
  function patch(partial: Partial<SpacerWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Estilo">
        <PropertyField label="Altura (px)">
          <Input
            type="number"
            min={1}
            max={500}
            value={config.heightPx}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              patch({ heightPx: clampSpacerHeight(next) });
            }}
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyColorSwatchReset
          label="Cor"
          value={getSpacerColorPickerValue(config)}
          onChange={(backgroundColor) => patch({ backgroundColor })}
          onReset={() => patch({ backgroundColor: null })}
        />
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
