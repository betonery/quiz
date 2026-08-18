"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import type { InputWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { VariableKeyCombobox } from "@/domains/quiz/components/variables/variable-key-combobox";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { resolveInputColors } from "@/domains/quiz/utils/input-widget-styles.utils";

type InputWidgetPropertiesProps = {
  config: InputWidgetConfig;
  onChange: (config: InputWidgetConfig) => void;
  onFeedback?: (message: string) => void;
};

export function InputWidgetProperties({
  config,
  onChange,
  onFeedback,
}: InputWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const ensureQuizVariable = useBuilderStore((s) => s.ensureQuizVariable);
  const resolvedColors = resolveInputColors(config, design);
  const [saveToVariable, setSaveToVariable] = useState(
    config.variableKey.length > 0,
  );

  useEffect(() => {
    setSaveToVariable(config.variableKey.length > 0);
  }, [config.variableKey]);

  function handleVariableKeyChange(variableKey: string) {
    if (variableKey) {
      ensureQuizVariable(variableKey, config.label);
    }
    onChange({ ...config, variableKey });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Entrada">
        <PropertyCheckbox
          label="Habilitar Label"
          checked={config.showLabel}
          onChange={(showLabel) => onChange({ ...config, showLabel })}
        />

        {config.showLabel && (
          <PropertyField label="Label">
            <Input
              value={config.label}
              onChange={(e) => onChange({ ...config, label: e.target.value })}
              className="bg-background shadow-sm"
            />
          </PropertyField>
        )}

        <PropertyField label="Placeholder">
          <Input
            value={config.placeholder}
            onChange={(e) =>
              onChange({ ...config, placeholder: e.target.value })
            }
            className="bg-background shadow-sm"
          />
        </PropertyField>

        <PropertyCheckbox
          label="Campo Obrigatório"
          checked={config.required}
          onChange={(required) => onChange({ ...config, required })}
        />

        <PropertyField label="Tipo">
          <PropertySelect
            value={config.inputType}
            onChange={(inputType) =>
              onChange({
                ...config,
                inputType: inputType as InputWidgetConfig["inputType"],
              })
            }
          >
            <option value="text">Texto</option>
            <option value="email">E-mail</option>
            <option value="phone">Telefone</option>
            <option value="password">Senha</option>
            <option value="number">Número</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Variável">
        <PropertyCheckbox
          label="Salvar resultado em uma variável"
          checked={saveToVariable}
          onChange={(enabled) => {
            setSaveToVariable(enabled);
            if (!enabled) {
              onChange({ ...config, variableKey: "" });
            }
          }}
        />
        {saveToVariable && (
          <PropertyField label="Variável">
            <VariableKeyCombobox
              value={config.variableKey}
              labelHint={config.label}
              onChange={handleVariableKeyChange}
            />
          </PropertyField>
        )}
        <p className="text-xs text-muted-foreground">
          O valor é gravado ao sair desta etapa. Use {"{{nome}}"} em textos das
          etapas seguintes.
        </p>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <PropertyField label="Alinhamento">
          <PropertySelect
            value={config.placeholderAlign}
            onChange={(placeholderAlign) =>
              onChange({
                ...config,
                placeholderAlign:
                  placeholderAlign as InputWidgetConfig["placeholderAlign"],
              })
            }
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Tamanho da fonte">
          <PropertySelect
            value={config.fontSize}
            onChange={(fontSize) =>
              onChange({
                ...config,
                fontSize: fontSize as InputWidgetConfig["fontSize"],
              })
            }
          >
            <option value="sm">Pequeno</option>
            <option value="md">Normal</option>
            <option value="lg">Grande</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Espaçamento">
          <PropertySelect
            value={config.paddingSize}
            onChange={(paddingSize) =>
              onChange({
                ...config,
                paddingSize: paddingSize as InputWidgetConfig["paddingSize"],
              })
            }
          >
            <option value="sm">Pequeno</option>
            <option value="md">Normal</option>
            <option value="lg">Grande</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <div className="grid grid-cols-3 gap-3">
          <PropertyColorSwatchReset
            label="Placeholder"
            value={resolvedColors.placeholderColor}
            onChange={(placeholderColor) =>
              onChange({ ...config, placeholderColor })
            }
            onReset={() => onChange({ ...config, placeholderColor: null })}
          />
          <PropertyColorSwatchReset
            label="Fundo"
            value={resolvedColors.backgroundColor}
            onChange={(backgroundColor) =>
              onChange({ ...config, backgroundColor })
            }
            onReset={() => onChange({ ...config, backgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Borda"
            value={resolvedColors.borderColor}
            onChange={(borderColor) => onChange({ ...config, borderColor })}
            onReset={() => onChange({ ...config, borderColor: null })}
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
