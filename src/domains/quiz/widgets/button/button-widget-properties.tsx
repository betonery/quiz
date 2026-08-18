"use client";

import type { ButtonWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  PropertiesSection,
  PropertyColorSwatch,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  BUTTON_STYLE_PRESETS,
  applyButtonVariant,
  detectButtonVariant,
} from "@/domains/quiz/widgets/button/button-widget-presets";
import { BUTTON_ANIMATION_LABELS } from "@/domains/quiz/utils/button-widget.utils";
import type { ButtonAnimation } from "@/domains/quiz/types/builder.types";

type ButtonWidgetPropertiesProps = {
  config: ButtonWidgetConfig;
  onChange: (config: ButtonWidgetConfig) => void;
  onFeedback?: (message: string) => void;
};

export function ButtonWidgetProperties({
  config,
  onChange,
  onFeedback,
}: ButtonWidgetPropertiesProps) {
  const detectedVariant = detectButtonVariant(config);

  function handleColorChange(
    patch: Partial<
      Pick<ButtonWidgetConfig, "backgroundColor" | "textColor" | "borderColor">
    >,
  ) {
    onChange({ ...config, ...patch, variant: "custom" });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Estilo">
        <PropertyField label="Modelo">
          <PropertySelect
            value={detectedVariant === "custom" ? "" : detectedVariant}
            onChange={(value) => {
              if (!value) return;
              onChange(
                applyButtonVariant(
                  config,
                  value as keyof typeof BUTTON_STYLE_PRESETS,
                ),
              );
            }}
          >
            {detectedVariant === "custom" && (
              <option value="" disabled>
                Personalizado
              </option>
            )}
            {(
              Object.entries(BUTTON_STYLE_PRESETS) as [
                keyof typeof BUTTON_STYLE_PRESETS,
                (typeof BUTTON_STYLE_PRESETS)[keyof typeof BUTTON_STYLE_PRESETS],
              ][]
            ).map(([variant, preset]) => (
              <option key={variant} value={variant}>
                {preset.label}
              </option>
            ))}
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Animação">
          <PropertySelect
            value={config.animation ?? "none"}
            onChange={(value) =>
              onChange({ ...config, animation: value as ButtonAnimation })
            }
          >
            {(
              Object.entries(BUTTON_ANIMATION_LABELS) as [
                ButtonAnimation,
                string,
              ][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Conteúdo">
          <VariableInsertField
            value={config.label}
            onChange={(label) => onChange({ ...config, label })}
            placeholder="Texto do botão"
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <div className="grid grid-cols-3 gap-3">
          <PropertyColorSwatch
            label="Cor"
            value={config.backgroundColor}
            onChange={(backgroundColor) =>
              handleColorChange({ backgroundColor })
            }
          />
          <PropertyColorSwatch
            label="Texto"
            value={config.textColor}
            onChange={(textColor) => handleColorChange({ textColor })}
          />
          <PropertyColorSwatch
            label="Borda"
            value={config.borderColor}
            onChange={(borderColor) => handleColorChange({ borderColor })}
          />
        </div>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
        onConfirmId={onFeedback}
      />
    </div>
  );
}
