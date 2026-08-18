"use client";

import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyColorSwatchReset,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { LinkUrlPreview } from "@/domains/quiz/components/variables/link-url-preview";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { PricingWidgetConfig } from "@/domains/quiz/types/builder.types";
import {
  centsToReaisInput,
  parseReaisInput,
} from "@/domains/quiz/utils/currency.utils";
import { resolvePricingColors } from "@/domains/quiz/utils/pricing-widget.utils";

type PricingWidgetPropertiesProps = {
  config: PricingWidgetConfig;
  onChange: (config: PricingWidgetConfig) => void;
};

export function PricingWidgetProperties({
  config,
  onChange,
}: PricingWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const variables = useBuilderStore((s) => s.variables);
  const resolvedColors = resolvePricingColors(config, design);

  function patch(partial: Partial<PricingWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleReaisChange(
    field: "priceCents" | "comparePriceCents" | "installmentCents",
    value: string,
  ) {
    const cents = parseReaisInput(value);
    if (cents === null && value.trim() !== "") return;
    patch({ [field]: cents });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Conteúdo">
        <PropertyField label="Título">
          <VariableInsertField
            value={config.title ?? ""}
            onChange={(title) => patch({ title: title || null })}
          />
        </PropertyField>
        <PropertyField label="Subtítulo">
          <VariableInsertField
            value={config.subtitle ?? ""}
            onChange={(subtitle) => patch({ subtitle: subtitle || null })}
            multiline
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Preço">
        <PropertyField label="Preço principal">
          <Input
            value={centsToReaisInput(config.priceCents)}
            onChange={(event) =>
              handleReaisChange("priceCents", event.target.value)
            }
            placeholder="497,00"
            className="bg-background shadow-sm"
          />
        </PropertyField>
        <PropertyField label="Mostrar preço comparativo">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showComparePrice}
              onChange={(event) =>
                patch({ showComparePrice: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
        {config.showComparePrice ? (
          <PropertyField label="Preço comparativo">
            <Input
              value={
                config.comparePriceCents != null
                  ? centsToReaisInput(config.comparePriceCents)
                  : ""
              }
              onChange={(event) =>
                handleReaisChange("comparePriceCents", event.target.value)
              }
              placeholder="997,00"
              className="bg-background shadow-sm"
            />
          </PropertyField>
        ) : null}
        <PropertyField label="Texto do badge">
          <VariableInsertField
            value={config.badgeText ?? ""}
            onChange={(badgeText) => patch({ badgeText: badgeText || null })}
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Parcelas">
        <PropertyField label="Mostrar parcelas">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showInstallments}
              onChange={(event) =>
                patch({ showInstallments: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
        {config.showInstallments ? (
          <>
            <PropertyField label="Quantidade de parcelas">
              <Input
                type="number"
                min={2}
                max={24}
                value={config.installmentCount ?? 12}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next)) return;
                  patch({
                    installmentCount: Math.min(
                      24,
                      Math.max(2, Math.round(next)),
                    ),
                  });
                }}
                className="bg-background shadow-sm"
              />
            </PropertyField>
            <PropertyField label="Valor da parcela (opcional)">
              <Input
                value={
                  config.installmentCents != null
                    ? centsToReaisInput(config.installmentCents)
                    : ""
                }
                onChange={(event) =>
                  handleReaisChange("installmentCents", event.target.value)
                }
                placeholder="Automático"
                className="bg-background shadow-sm"
              />
            </PropertyField>
          </>
        ) : null}
      </PropertiesSection>

      <PropertiesSection title="CTA">
        <PropertyField label="Texto do botão">
          <VariableInsertField
            value={config.ctaLabel ?? ""}
            onChange={(ctaLabel) => patch({ ctaLabel: ctaLabel || null })}
          />
        </PropertyField>
        <PropertyField label="URL do botão">
          <VariableInsertField
            value={config.ctaUrl ?? ""}
            onChange={(ctaUrl) => patch({ ctaUrl: ctaUrl || null })}
          />
        </PropertyField>
        {config.ctaUrl ? (
          <LinkUrlPreview url={config.ctaUrl} variables={variables} />
        ) : null}
        <PropertyField label="Abrir em nova aba">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.ctaOpenInNewTab}
              onChange={(event) =>
                patch({ ctaOpenInNewTab: event.target.checked })
              }
            />
            Sim
          </label>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Destaque"
            value={resolvedColors.highlight}
            onChange={(highlightColor) => patch({ highlightColor })}
            onReset={() => patch({ highlightColor: null })}
          />
          <PropertyColorSwatchReset
            label="Fundo"
            value={resolvedColors.background}
            onChange={(backgroundColor) => patch({ backgroundColor })}
            onReset={() => patch({ backgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Título"
            value={resolvedColors.title}
            onChange={(titleColor) => patch({ titleColor })}
            onReset={() => patch({ titleColor: null })}
          />
          <PropertyColorSwatchReset
            label="Preço"
            value={resolvedColors.price}
            onChange={(priceColor) => patch({ priceColor })}
            onReset={() => patch({ priceColor: null })}
          />
          <PropertyColorSwatchReset
            label="Comparativo"
            value={resolvedColors.comparePrice}
            onChange={(comparePriceColor) => patch({ comparePriceColor })}
            onReset={() => patch({ comparePriceColor: null })}
          />
          <PropertyColorSwatchReset
            label="Subtítulo"
            value={resolvedColors.subtitle}
            onChange={(subtitleColor) => patch({ subtitleColor })}
            onReset={() => patch({ subtitleColor: null })}
          />
          <PropertyColorSwatchReset
            label="Badge fundo"
            value={resolvedColors.badgeBackground}
            onChange={(badgeBackgroundColor) => patch({ badgeBackgroundColor })}
            onReset={() => patch({ badgeBackgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Badge texto"
            value={resolvedColors.badgeText}
            onChange={(badgeTextColor) => patch({ badgeTextColor })}
            onReset={() => patch({ badgeTextColor: null })}
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
