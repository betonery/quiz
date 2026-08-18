"use client";

import {
  PropertiesSection,
  PropertyField,
  PropertyRange,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { StepTransition } from "@/domains/quiz/types/design.types";

export function DesignAnimationSection() {
  const design = useBuilderStore((s) => s.design);
  const updateDesign = useBuilderStore((s) => s.updateDesign);

  return (
    <PropertiesSection title="Animação" variant="dark">
      <PropertyField label="Transição de Etapas" variant="dark">
        <PropertySelect
          variant="dark"
          value={design.animation.stepTransition}
          onChange={(value) =>
            updateDesign({
              animation: {
                ...design.animation,
                stepTransition: value as StepTransition,
              },
            })
          }
        >
          <option value="fade_in">Fade In</option>
          <option value="slide">Escorregar</option>
          <option value="zoom">Zoom</option>
          <option value="none">Nenhuma animação</option>
        </PropertySelect>
      </PropertyField>

      <PropertyRange
        variant="dark"
        label="Delay da Transição"
        min={0}
        max={2}
        step={0.1}
        formatValue={(v) => `${v}s`}
        value={design.animation.delay}
        onChange={(delay) =>
          updateDesign({
            animation: {
              ...design.animation,
              delay,
            },
          })
        }
      />

      <PropertyRange
        variant="dark"
        label="Duração da Transição"
        min={0}
        max={2}
        step={0.1}
        formatValue={(v) => `${v}s`}
        value={design.animation.duration}
        onChange={(duration) =>
          updateDesign({
            animation: {
              ...design.animation,
              duration,
            },
          })
        }
      />

      <p className="text-xs leading-relaxed text-slate-500">
        As animações entre etapas são visíveis ao usar o botão Play ou no funil
        publicado.
      </p>
    </PropertiesSection>
  );
}
