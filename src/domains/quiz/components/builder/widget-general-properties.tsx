"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WidgetLayoutFields } from "@/domains/quiz/types/builder.types";
import {
  PropertiesSection,
  PropertyField,
  PropertyRange,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";

type WidgetGeneralPropertiesProps = {
  layout: WidgetLayoutFields;
  onChange: (layout: Partial<WidgetLayoutFields>) => void;
  onConfirmId?: (message: string) => void;
};

export function WidgetGeneralProperties({
  layout,
  onChange,
  onConfirmId,
}: WidgetGeneralPropertiesProps) {
  const [componentIdDraft, setComponentIdDraft] = useState(
    layout.componentId ?? "",
  );

  useEffect(() => {
    setComponentIdDraft(layout.componentId ?? "");
  }, [layout.componentId]);

  function handleConfirmId() {
    const value = componentIdDraft.trim();
    onChange({ componentId: value || undefined });
    onConfirmId?.(
      value ? "ID do componente confirmado" : "ID do componente removido",
    );
  }

  return (
    <>
      <PropertiesSection title="Avançado">
        <PropertyField label="ID do componente">
          <div className="space-y-2">
            <Input
              value={componentIdDraft}
              onChange={(e) => setComponentIdDraft(e.target.value)}
              placeholder="Ex: dPFahA"
              className="bg-background shadow-sm"
            />
            <Button
              type="button"
              variant="brand"
              size="sm"
              className="w-full"
              onClick={handleConfirmId}
            >
              Confirmar ID
            </Button>
          </div>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Geral">
        <PropertyRange
          label="Tamanho máximo"
          value={layout.maxWidth}
          min={20}
          max={100}
          step={5}
          formatValue={(value) => `${value}%`}
          onChange={(maxWidth) => onChange({ maxWidth })}
        />

        <PropertyField label="Alinhamento">
          <PropertySelect
            value={layout.horizontalAlign}
            onChange={(horizontalAlign) =>
              onChange({
                horizontalAlign:
                  horizontalAlign as WidgetLayoutFields["horizontalAlign"],
              })
            }
          >
            <option value="start">Começo</option>
            <option value="center">Meio</option>
            <option value="end">Final</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>
    </>
  );
}
