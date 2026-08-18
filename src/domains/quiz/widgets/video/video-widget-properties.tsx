"use client";

import type { VideoWidgetConfig } from "@/domains/quiz/types/builder.types";
import { parseVideoEmbedInput } from "@/domains/quiz/utils/video-embed.utils";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  PropertiesSection,
  PropertyField,
  PropertySelect,
  propertyTextareaClass,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VideoWidgetRenderer } from "@/domains/quiz/widgets/video/video-widget-renderer";

type VideoWidgetPropertiesProps = {
  config: VideoWidgetConfig;
  onChange: (config: VideoWidgetConfig) => void;
};

export function VideoWidgetProperties({
  config,
  onChange,
}: VideoWidgetPropertiesProps) {
  function patch(partial: Partial<VideoWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  const previewConfig = config.embedCode.trim()
    ? config
    : { ...config, embedCode: "" };
  const isValid = Boolean(parseVideoEmbedInput(config.embedCode));

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Código de incorporação ou URL">
          <textarea
            value={config.embedCode}
            onChange={(e) => patch({ embedCode: e.target.value })}
            placeholder="Cole o iframe ou URL do YouTube, Vimeo ou Loom..."
            className={propertyTextareaClass}
          />
        </PropertyField>
        {config.embedCode.trim() && !isValid ? (
          <p className="text-xs text-amber-600">
            URL ou iframe inválido. Use YouTube, Vimeo ou Loom.
          </p>
        ) : null}
        {isValid ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <VideoWidgetRenderer config={previewConfig} />
          </div>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Aspecto">
        <PropertyField label="Proporção">
          <PropertySelect
            value={config.aspect}
            onChange={(value) =>
              patch({ aspect: value as VideoWidgetConfig["aspect"] })
            }
          >
            <option value="standard">Padrão (16:9)</option>
            <option value="vertical">Vertical (9:16)</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
