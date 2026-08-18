"use client";

import type { TextWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  PropertyFontSizeStepper,
  PropertyNumericStepper,
} from "@/domains/quiz/components/builder/property-font-size-stepper";
import {
  PropertiesSection,
  PropertyColorField,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { TextRichEditor } from "@/domains/quiz/widgets/text/text-rich-editor";

type TextWidgetPropertiesProps = {
  config: TextWidgetConfig;
  onChange: (config: TextWidgetConfig) => void;
  onFeedback?: (message: string) => void;
};

export function TextWidgetProperties({
  config,
  onChange,
  onFeedback,
}: TextWidgetPropertiesProps) {
  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Texto">
          <TextRichEditor config={config} onChange={onChange} />
        </PropertyField>
        <p className="text-xs text-muted-foreground">
          Use o botão {"{}"} para inserir variáveis do funil.
        </p>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <PropertyField label="Tamanho da fonte">
          <PropertyFontSizeStepper
            value={config.fontSizePx}
            onChange={(fontSizePx) => onChange({ ...config, fontSizePx })}
          />
        </PropertyField>

        <PropertyField label="Espaçamento entre caracteres">
          <PropertyNumericStepper
            value={config.letterSpacingPx}
            min={-2}
            max={20}
            step={0.5}
            unit="px"
            decreaseAriaLabel="Diminuir espaçamento"
            increaseAriaLabel="Aumentar espaçamento"
            onChange={(letterSpacingPx) =>
              onChange({ ...config, letterSpacingPx })
            }
          />
        </PropertyField>

        <PropertyField label="Peso">
          <PropertySelect
            value={config.fontWeight}
            onChange={(fontWeight) =>
              onChange({
                ...config,
                fontWeight: fontWeight as TextWidgetConfig["fontWeight"],
              })
            }
          >
            <option value="normal">Normal</option>
            <option value="semibold">Semi-negrito</option>
            <option value="bold">Negrito</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Alinhamento do texto">
          <PropertySelect
            value={config.align}
            onChange={(align) =>
              onChange({
                ...config,
                align: align as TextWidgetConfig["align"],
              })
            }
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <PropertyColorField
          label="Cor do texto"
          value={config.color}
          onChange={(color) => onChange({ ...config, color })}
        />
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
        onConfirmId={onFeedback}
      />
    </div>
  );
}
