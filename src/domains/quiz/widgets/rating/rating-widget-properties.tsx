"use client";

import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { RatingWidgetConfig } from "@/domains/quiz/types/builder.types";
import { resolveRatingColors } from "@/domains/quiz/utils/rating-widget.utils";

type RatingWidgetPropertiesProps = {
  config: RatingWidgetConfig;
  onChange: (config: RatingWidgetConfig) => void;
};

export function RatingWidgetProperties({
  config,
  onChange,
}: RatingWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const variables = useBuilderStore((s) => s.variables);
  const resolvedColors = resolveRatingColors(config, design);

  function patch(partial: Partial<RatingWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Nota">
        <PropertyField label="Usar variável numérica">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.useVariableScore}
              onChange={(event) =>
                patch({ useVariableScore: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
        {config.useVariableScore ? (
          <PropertyField label="Variável de nota">
            <PropertySelect
              value={config.scoreVariableKey ?? ""}
              onChange={(scoreVariableKey) =>
                patch({ scoreVariableKey: scoreVariableKey || null })
              }
            >
              <option value="">Selecione</option>
              {variables.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label ?? item.key}
                </option>
              ))}
            </PropertySelect>
          </PropertyField>
        ) : (
          <PropertyField label="Nota (0–5)">
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={config.score}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                patch({ score: Math.min(5, Math.max(0, next)) });
              }}
              className="bg-background shadow-sm"
            />
          </PropertyField>
        )}
        <PropertyField label="Meias estrelas">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showHalfStars}
              onChange={(event) =>
                patch({ showHalfStars: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Textos">
        <PropertyField label="Total de avaliações">
          <VariableInsertField
            value={config.totalReviewsText}
            onChange={(totalReviewsText) => patch({ totalReviewsText })}
          />
        </PropertyField>
        <PropertyField label="Subtítulo">
          <VariableInsertField
            value={config.subtitle ?? ""}
            onChange={(subtitle) => patch({ subtitle: subtitle || null })}
          />
        </PropertyField>
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(layout) =>
              patch({ layout: layout as RatingWidgetConfig["layout"] })
            }
          >
            <option value="stacked">Vertical</option>
            <option value="inline">Horizontal</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Estrelas"
            value={resolvedColors.star}
            onChange={(starColor) => patch({ starColor })}
            onReset={() => patch({ starColor: null })}
          />
          <PropertyColorSwatchReset
            label="Nota"
            value={resolvedColors.score}
            onChange={(scoreColor) => patch({ scoreColor })}
            onReset={() => patch({ scoreColor: null })}
          />
          <PropertyColorSwatchReset
            label="Subtítulo"
            value={resolvedColors.subtitle}
            onChange={(subtitleColor) => patch({ subtitleColor })}
            onReset={() => patch({ subtitleColor: null })}
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
