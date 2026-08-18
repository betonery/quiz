"use client";

import {
  PropertiesSection,
  PropertyColorSwatch,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";

export function DesignColorsSection() {
  const design = useBuilderStore((s) => s.design);
  const updateDesign = useBuilderStore((s) => s.updateDesign);

  const swatches = [
    {
      key: "primary" as const,
      label: "Primária",
    },
    {
      key: "background" as const,
      label: "Fundo",
    },
    {
      key: "titles" as const,
      label: "Títulos",
    },
    {
      key: "texts" as const,
      label: "Textos",
    },
    {
      key: "interactiveTexts" as const,
      label: "Textos Interativos",
    },
  ];

  return (
    <PropertiesSection title="Cores" variant="dark">
      <div className="grid grid-cols-2 gap-3">
        {swatches.map((swatch) => (
          <PropertyColorSwatch
            key={swatch.key}
            variant="dark"
            label={swatch.label}
            value={design.colors[swatch.key]}
            onChange={(value) =>
              updateDesign({
                colors: { ...design.colors, [swatch.key]: value },
              })
            }
          />
        ))}
      </div>
    </PropertiesSection>
  );
}
