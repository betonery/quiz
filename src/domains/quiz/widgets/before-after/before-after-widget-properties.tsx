"use client";

import { Input } from "@/components/ui/input";
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
import type { BeforeAfterWidgetConfig } from "@/domains/quiz/types/builder.types";
import type { BeforeAfterSide } from "@/domains/quiz/types/media.types";
import {
  clampSliderPosition,
  resolveBeforeAfterColors,
} from "@/domains/quiz/utils/before-after-widget.utils";

type BeforeAfterWidgetPropertiesProps = {
  config: BeforeAfterWidgetConfig;
  onChange: (config: BeforeAfterWidgetConfig) => void;
};

function SideEditor({
  label,
  side,
  onChange,
}: {
  label: string;
  side: BeforeAfterSide;
  onChange: (side: BeforeAfterSide) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <PropertyField label="Tipo">
        <PropertySelect
          value={side.imageType}
          onChange={(imageType) =>
            onChange({
              ...side,
              imageType: imageType as BeforeAfterSide["imageType"],
            })
          }
        >
          <option value="emoji">Emoji</option>
          <option value="url">URL</option>
          <option value="file">Upload</option>
          <option value="none">Nenhum</option>
        </PropertySelect>
      </PropertyField>
      {side.imageType === "emoji" ? (
        <PropertyField label="Emoji">
          <div className="mb-2 flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-2xl shadow-sm">
            {side.emoji || "😔"}
          </div>
          <EmojiPickerGrid
            value={side.emoji}
            onSelect={(emoji) => onChange({ ...side, emoji })}
          />
        </PropertyField>
      ) : null}
      {side.imageType === "url" || side.imageType === "file" ? (
        <MediaSourcePicker
          mode="carousel-slide"
          subfolder="media"
          value={{
            id: "side",
            text: "",
            imageType: side.imageType,
            emoji: side.emoji,
            url: side.url,
            filePath: side.filePath,
          }}
          onChange={(patch) =>
            onChange({
              ...side,
              imageType:
                (patch.imageType as BeforeAfterSide["imageType"]) ??
                side.imageType,
              url: patch.url as string | undefined,
              filePath: patch.filePath as string | undefined,
              emoji: patch.emoji as string | undefined,
            })
          }
        />
      ) : null}
      <PropertyField label="Legenda">
        <Input
          value={side.caption}
          onChange={(event) =>
            onChange({ ...side, caption: event.target.value })
          }
          className="bg-background shadow-sm"
        />
      </PropertyField>
    </div>
  );
}

export function BeforeAfterWidgetProperties({
  config,
  onChange,
}: BeforeAfterWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const resolvedColors = resolveBeforeAfterColors(config, design);

  function patch(partial: Partial<BeforeAfterWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Layout">
        <PropertyField label="Modo">
          <PropertySelect
            value={config.layout}
            onChange={(layout) =>
              patch({ layout: layout as BeforeAfterWidgetConfig["layout"] })
            }
          >
            <option value="columns">Duas colunas</option>
            <option value="slider">Slider</option>
          </PropertySelect>
        </PropertyField>
        {config.layout === "slider" ? (
          <PropertyField label="Posição inicial (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={config.sliderInitialPosition}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                patch({ sliderInitialPosition: clampSliderPosition(next) });
              }}
              className="bg-background shadow-sm"
            />
          </PropertyField>
        ) : null}
        <PropertyField label="Bordas">
          <PropertySelect
            value={config.imageBorderRadius}
            onChange={(imageBorderRadius) =>
              patch({
                imageBorderRadius:
                  imageBorderRadius as BeforeAfterWidgetConfig["imageBorderRadius"],
              })
            }
          >
            <option value="sm">Pequena</option>
            <option value="md">Média</option>
            <option value="lg">Grande</option>
            <option value="xl">Extra grande</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Conteúdo">
        <PropertyField label="Label antes">
          <VariableInsertField
            value={config.beforeLabel}
            onChange={(beforeLabel) => patch({ beforeLabel })}
          />
        </PropertyField>
        <PropertyField label="Label depois">
          <VariableInsertField
            value={config.afterLabel}
            onChange={(afterLabel) => patch({ afterLabel })}
          />
        </PropertyField>
        <SideEditor
          label="Antes"
          side={config.before}
          onChange={(before) => patch({ before })}
        />
        <SideEditor
          label="Depois"
          side={config.after}
          onChange={(after) => patch({ after })}
        />
        <PropertyField label="Disclaimer">
          <VariableInsertField
            value={config.disclaimer ?? ""}
            onChange={(disclaimer) => patch({ disclaimer: disclaimer || null })}
            multiline
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Labels"
            value={resolvedColors.label}
            onChange={(labelColor) => patch({ labelColor })}
            onReset={() => patch({ labelColor: null })}
          />
          <PropertyColorSwatchReset
            label="Disclaimer"
            value={resolvedColors.disclaimer}
            onChange={(disclaimerColor) => patch({ disclaimerColor })}
            onReset={() => patch({ disclaimerColor: null })}
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
