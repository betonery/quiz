"use client";

import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { EmojiPickerGrid } from "@/domains/quiz/components/builder/emoji-picker-grid";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { MediaSourcePicker } from "@/domains/quiz/widgets/shared/media-source-picker";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { TrustBadgeWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { TrustBadgePreset } from "@/domains/quiz/types/media.types";
import {
  TRUST_BADGE_PRESET_COPY,
  resolveTrustBadgeColors,
} from "@/domains/quiz/utils/trust-badge-widget.utils";

type TrustBadgeWidgetPropertiesProps = {
  config: TrustBadgeWidgetConfig;
  onChange: (config: TrustBadgeWidgetConfig) => void;
};

export function TrustBadgeWidgetProperties({
  config,
  onChange,
}: TrustBadgeWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveTrustBadgeColors(config, design);

  function patch(partial: Partial<TrustBadgeWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function applyPreset(preset: TrustBadgePreset) {
    const copy = TRUST_BADGE_PRESET_COPY[preset];
    patch({
      preset,
      title: copy.title,
      subtitle: copy.subtitle,
      iconType: "preset",
    });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Preset">
          <PropertySelect
            value={config.preset}
            onChange={(value) => applyPreset(value as TrustBadgePreset)}
          >
            <option value="guarantee">Garantia</option>
            <option value="security">Segurança</option>
            <option value="delivery">Entrega</option>
            <option value="certificate">Certificado</option>
            <option value="custom">Personalizado</option>
          </PropertySelect>
        </PropertyField>
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(layout) =>
              patch({ layout: layout as TrustBadgeWidgetConfig["layout"] })
            }
          >
            <option value="card">Card</option>
            <option value="inline">Barra horizontal</option>
          </PropertySelect>
        </PropertyField>
        <PropertyField label="Tipo de ícone">
          <PropertySelect
            value={config.iconType}
            onChange={(iconType) =>
              patch({
                iconType: iconType as TrustBadgeWidgetConfig["iconType"],
              })
            }
          >
            <option value="preset">Preset</option>
            <option value="emoji">Emoji</option>
            <option value="image">Imagem</option>
          </PropertySelect>
        </PropertyField>
        {config.iconType === "emoji" ? (
          <PropertyField label="Emoji">
            <div className="mb-2 flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-2xl shadow-sm">
              {config.emoji || "🛡️"}
            </div>
            <EmojiPickerGrid
              value={config.emoji}
              onSelect={(emoji) => patch({ emoji })}
            />
          </PropertyField>
        ) : null}
        {config.iconType === "image" ? (
          <PropertyField label="Imagem do selo">
            <MediaSourcePicker
              mode="image"
              subfolder="media"
              value={config.imageSource}
              onChange={(imageSource) =>
                patch({
                  imageSource: { ...config.imageSource, ...imageSource },
                })
              }
            />
          </PropertyField>
        ) : null}
        <PropertyField label="Título">
          <VariableInsertField
            value={config.title}
            onChange={(title) => patch({ title })}
          />
        </PropertyField>
        <PropertyField label="Subtítulo">
          <VariableInsertField
            value={config.subtitle}
            onChange={(subtitle) => patch({ subtitle })}
            multiline
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Fundo"
            value={resolvedColors.background}
            onChange={(backgroundColor) => patch({ backgroundColor })}
            onReset={() => patch({ backgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Borda"
            value={resolvedColors.border}
            onChange={(borderColor) => patch({ borderColor })}
            onReset={() => patch({ borderColor: null })}
          />
          <PropertyColorSwatchReset
            label="Ícone"
            value={resolvedColors.icon}
            onChange={(iconColor) => patch({ iconColor })}
            onReset={() => patch({ iconColor: null })}
          />
          <PropertyColorSwatchReset
            label="Título"
            value={resolvedColors.title}
            onChange={(titleColor) => patch({ titleColor })}
            onReset={() => patch({ titleColor: null })}
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
