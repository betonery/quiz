"use client";

import type { ImageWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  MEDIA_BORDER_RADIUS_LABELS,
  MEDIA_WIDTH_LABELS,
} from "@/domains/quiz/utils/media-widget-styles.utils";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  PropertiesSection,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { MediaSourcePicker } from "@/domains/quiz/widgets/shared/media-source-picker";

type ImageWidgetPropertiesProps = {
  config: ImageWidgetConfig;
  onChange: (config: ImageWidgetConfig) => void;
};

export function ImageWidgetProperties({
  config,
  onChange,
}: ImageWidgetPropertiesProps) {
  function patch(partial: Partial<ImageWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Origem">
        <PropertyField label="Imagem">
          <MediaSourcePicker
            mode="image"
            value={config.source}
            subfolder="media"
            onChange={(sourcePatch) =>
              patch({ source: { ...config.source, ...sourcePatch } })
            }
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Largura">
        <PropertyField label="Tamanho">
          <PropertySelect
            value={config.width}
            onChange={(value) =>
              patch({ width: value as ImageWidgetConfig["width"] })
            }
          >
            {(
              Object.entries(MEDIA_WIDTH_LABELS) as [
                ImageWidgetConfig["width"],
                string,
              ][]
            ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Borda arredondada">
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.entries(MEDIA_BORDER_RADIUS_LABELS) as [
              ImageWidgetConfig["borderRadius"],
              string,
            ][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => patch({ borderRadius: value })}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                config.borderRadius === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
