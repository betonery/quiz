"use client";

import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import type { EmbedWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  EMBED_SUPPORTED_PROVIDERS_HINT,
  parseEmbedInput,
} from "@/domains/quiz/utils/embed-widget.utils";

type EmbedWidgetPropertiesProps = {
  config: EmbedWidgetConfig;
  onChange: (config: EmbedWidgetConfig) => void;
};

export function EmbedWidgetProperties({
  config,
  onChange,
}: EmbedWidgetPropertiesProps) {
  function patch(partial: Partial<EmbedWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  const parsed = parseEmbedInput(config.embedInput);

  return (
    <div className="space-y-4">
      <PropertiesSection title="Embed">
        <PropertyField label="URL ou iframe">
          <textarea
            value={config.embedInput}
            onChange={(event) => patch({ embedInput: event.target.value })}
            placeholder="https://calendly.com/..."
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          />
        </PropertyField>
        {config.embedInput.trim() && !parsed ? (
          <p className="text-xs text-destructive">
            URL ou iframe inválido. Providers suportados:{" "}
            {EMBED_SUPPORTED_PROVIDERS_HINT}
          </p>
        ) : null}
        {parsed ? (
          <p className="text-xs text-muted-foreground">
            Provider: <span className="font-mono">{parsed.provider}</span>
          </p>
        ) : null}
        <PropertyField label="Proporção">
          <PropertySelect
            value={config.aspectRatio}
            onChange={(aspectRatio) =>
              patch({
                aspectRatio: aspectRatio as EmbedWidgetConfig["aspectRatio"],
              })
            }
          >
            <option value="16:9">16:9</option>
            <option value="4:3">4:3</option>
            <option value="1:1">1:1</option>
            <option value="custom">Altura customizada</option>
          </PropertySelect>
        </PropertyField>
        {config.aspectRatio === "custom" ? (
          <PropertyField label="Altura (px)">
            <Input
              type="number"
              min={200}
              max={1200}
              value={config.customHeightPx ?? 480}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                patch({ customHeightPx: Math.min(1200, Math.max(200, next)) });
              }}
              className="bg-background shadow-sm"
            />
          </PropertyField>
        ) : null}
        <PropertyField label="Título (acessibilidade)">
          <Input
            value={config.title ?? ""}
            onChange={(event) => patch({ title: event.target.value || null })}
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyField label="Permitir tela cheia">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.allowFullscreen}
              onChange={(event) =>
                patch({ allowFullscreen: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
      />
    </div>
  );
}
