"use client";

import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { VariableInsertField } from "@/domains/quiz/components/variables/variable-insert-field";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type { CountdownWidgetConfig } from "@/domains/quiz/types/builder.types";
import { resolveCountdownColors } from "@/domains/quiz/utils/countdown-widget.utils";

type CountdownWidgetPropertiesProps = {
  config: CountdownWidgetConfig;
  onChange: (config: CountdownWidgetConfig) => void;
  widgetId?: string;
};

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function CountdownWidgetProperties({
  config,
  onChange,
  widgetId,
}: CountdownWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const disconnectCountdownFlowEdges = useBuilderStore(
    (s) => s.disconnectCountdownFlowEdges,
  );
  const resolvedColors = resolveCountdownColors(config, design);

  function patch(partial: Partial<CountdownWidgetConfig>) {
    onChange({ ...config, ...partial });
  }

  function handleFlowOutputToggle(flowOutputEnabled: boolean) {
    if (!flowOutputEnabled && widgetId) {
      disconnectCountdownFlowEdges(widgetId);
    }
    patch({ flowOutputEnabled });
  }

  const sessionMinutes = Math.floor(config.sessionDurationSeconds / 60);
  const sessionSeconds = config.sessionDurationSeconds % 60;

  return (
    <div className="space-y-4">
      <PropertiesSection title="Timer">
        <PropertyField label="Modo">
          <PropertySelect
            value={config.mode}
            onChange={(mode) =>
              patch({ mode: mode as CountdownWidgetConfig["mode"] })
            }
          >
            <option value="session">Sessão (por visita)</option>
            <option value="fixed">Data fixa</option>
          </PropertySelect>
        </PropertyField>

        {config.mode === "session" ? (
          <div className="grid grid-cols-2 gap-3">
            <PropertyField label="Minutos">
              <Input
                type="number"
                min={0}
                max={1440}
                value={sessionMinutes}
                onChange={(event) => {
                  const minutes = Number(event.target.value);
                  if (!Number.isFinite(minutes)) return;
                  const total = Math.min(
                    86400,
                    Math.max(1, minutes * 60 + sessionSeconds),
                  );
                  patch({ sessionDurationSeconds: total });
                }}
                className="bg-background shadow-sm"
              />
            </PropertyField>
            <PropertyField label="Segundos">
              <Input
                type="number"
                min={0}
                max={59}
                value={sessionSeconds}
                onChange={(event) => {
                  const seconds = Number(event.target.value);
                  if (!Number.isFinite(seconds)) return;
                  const total = Math.min(
                    86400,
                    Math.max(1, sessionMinutes * 60 + seconds),
                  );
                  patch({ sessionDurationSeconds: total });
                }}
                className="bg-background shadow-sm"
              />
            </PropertyField>
          </div>
        ) : (
          <PropertyField label="Data e hora">
            <Input
              type="datetime-local"
              value={isoToDatetimeLocal(config.targetDateIso)}
              onChange={(event) =>
                patch({ targetDateIso: datetimeLocalToIso(event.target.value) })
              }
              className="bg-background shadow-sm"
            />
          </PropertyField>
        )}

        <PropertyField label="Mostrar dias">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showDays}
              onChange={(event) => patch({ showDays: event.target.checked })}
            />
            Sim
          </label>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Textos">
        <PropertyField label="Label acima">
          <VariableInsertField
            value={config.labelAbove}
            onChange={(labelAbove) => patch({ labelAbove })}
          />
        </PropertyField>
        <PropertyField label="Label abaixo">
          <VariableInsertField
            value={config.labelBelow ?? ""}
            onChange={(labelBelow) => patch({ labelBelow: labelBelow || null })}
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Ao zerar">
        <PropertyCheckbox
          label="Conectar saída no fluxo"
          checked={config.flowOutputEnabled}
          onChange={handleFlowOutputToggle}
        />

        <PropertyField label="Mensagem">
          <VariableInsertField
            value={config.expiredMessage ?? ""}
            onChange={(expiredMessage) =>
              patch({ expiredMessage: expiredMessage || null })
            }
            multiline
          />
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Estilo">
        <div className="grid grid-cols-2 gap-3">
          <PropertyColorSwatchReset
            label="Dígitos fundo"
            value={resolvedColors.digitBackground}
            onChange={(digitBackgroundColor) => patch({ digitBackgroundColor })}
            onReset={() => patch({ digitBackgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Dígitos texto"
            value={resolvedColors.digitText}
            onChange={(digitTextColor) => patch({ digitTextColor })}
            onReset={() => patch({ digitTextColor: null })}
          />
          <PropertyColorSwatchReset
            label="Labels"
            value={resolvedColors.label}
            onChange={(labelColor) => patch({ labelColor })}
            onReset={() => patch({ labelColor: null })}
          />
          <PropertyColorSwatchReset
            label="Separador"
            value={resolvedColors.separator}
            onChange={(separatorColor) => patch({ separatorColor })}
            onReset={() => patch({ separatorColor: null })}
          />
          <PropertyColorSwatchReset
            label="Borda"
            value={resolvedColors.accent}
            onChange={(accentColor) => patch({ accentColor })}
            onReset={() => patch({ accentColor: null })}
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
