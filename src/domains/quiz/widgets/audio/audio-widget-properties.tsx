"use client";

import type { AudioWidgetConfig } from "@/domains/quiz/types/builder.types";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import { resolveAudioColors } from "@/domains/quiz/utils/media-widget-colors.utils";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { Input } from "@/components/ui/input";
import { MediaSourcePicker } from "@/domains/quiz/widgets/shared/media-source-picker";

type AudioWidgetPropertiesProps = {
  config: AudioWidgetConfig;
  onChange: (config: AudioWidgetConfig) => void;
};

export function AudioWidgetProperties({
  config,
  onChange,
}: AudioWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveAudioColors(config, design);

  function patch(partial: Partial<AudioWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo do áudio">
        <PropertyField label="Áudio">
          <MediaSourcePicker
            mode="audio"
            value={config.source}
            subfolder="audio"
            onChange={(sourcePatch) =>
              patch({ source: { ...config.source, ...sourcePatch } })
            }
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <PropertyField label="Horário de envio">
          <Input
            value={config.sentAtLabel}
            onChange={(e) => patch({ sentAtLabel: e.target.value })}
            placeholder="14:32"
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyCheckbox
          label="Exibir foto do remetente"
          checked={config.showAvatar !== false}
          onChange={(showAvatar) => patch({ showAvatar })}
        />
        {config.showAvatar !== false ? (
          <PropertyField label="Foto do remetente">
            <MediaSourcePicker
              mode="avatar"
              value={config.avatar}
              subfolder="media"
              onChange={(avatarPatch) =>
                patch({ avatar: { ...config.avatar, ...avatarPatch } })
              }
            />
          </PropertyField>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Bolha"
            value={resolvedColors.bubble}
            onChange={(bubbleColor) => patch({ bubbleColor })}
            onReset={() => patch({ bubbleColor: null })}
          />
          <PropertyColorSwatchReset
            label="Botão play"
            value={resolvedColors.playButton}
            onChange={(playButtonColor) => patch({ playButtonColor })}
            onReset={() => patch({ playButtonColor: null })}
          />
          <PropertyColorSwatchReset
            label="Progresso"
            value={resolvedColors.progress}
            onChange={(progressColor) => patch({ progressColor })}
            onReset={() => patch({ progressColor: null })}
          />
          <PropertyColorSwatchReset
            label="Horário"
            value={resolvedColors.time}
            onChange={(timeColor) => patch({ timeColor })}
            onReset={() => patch({ timeColor: null })}
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
