"use client";

import { Input } from "@/components/ui/input";
import { BUILDER_OUTER_COLUMN_CLASS } from "@/domains/quiz/components/builder/builder-layout";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyField,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import type {
  ButtonWidgetConfig,
  InputWidgetConfig,
  OptionsWidgetConfig,
  TextWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import { ButtonWidgetProperties } from "@/domains/quiz/widgets/button/button-widget-properties";
import { InputWidgetProperties } from "@/domains/quiz/widgets/input/input-widget-properties";
import { OptionsWidgetProperties } from "@/domains/quiz/widgets/options/options-widget-properties";
import { TextWidgetProperties } from "@/domains/quiz/widgets/text/text-widget-properties";
import { cn } from "@/lib/utils";

export function PropertiesPanel() {
  const steps = useBuilderStore((s) => s.steps);
  const widgets = useBuilderStore((s) => s.widgets);
  const activeStepId = useBuilderStore((s) => s.activeStepId);
  const selectedWidgetId = useBuilderStore((s) => s.selectedWidgetId);
  const updateStep = useBuilderStore((s) => s.updateStep);
  const updateWidget = useBuilderStore((s) => s.updateWidget);
  const setFeedback = useBuilderStore((s) => s.setFeedback);

  const activeStep = steps.find((s) => s.id === activeStepId);
  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId);

  const panelTitle = selectedWidget
    ? selectedWidget.type === "text"
      ? "Texto"
      : selectedWidget.type === "input"
        ? "Entrada"
        : selectedWidget.type === "options"
          ? "Opções"
          : "Botão"
    : (activeStep?.title ?? "Propriedades");

  return (
    <aside
      className={cn(
        "flex flex-col border-l border-border bg-card",
        BUILDER_OUTER_COLUMN_CLASS,
      )}
    >
      <div className="border-b border-border bg-card px-5 py-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {selectedWidget ? "Widget" : "Etapa"}
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          {panelTitle}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
        {selectedWidget?.type === "text" && (
          <TextWidgetProperties
            config={selectedWidget.config as TextWidgetConfig}
            onChange={(config) => updateWidget(selectedWidget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {selectedWidget?.type === "button" && (
          <ButtonWidgetProperties
            config={selectedWidget.config as ButtonWidgetConfig}
            onChange={(config) => updateWidget(selectedWidget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {selectedWidget?.type === "input" && (
          <InputWidgetProperties
            config={selectedWidget.config as InputWidgetConfig}
            onChange={(config) => updateWidget(selectedWidget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {selectedWidget?.type === "options" && (
          <OptionsWidgetProperties
            config={selectedWidget.config as OptionsWidgetConfig}
            onChange={(config) => updateWidget(selectedWidget.id, config)}
            onFeedback={setFeedback}
          />
        )}

        {!selectedWidget && activeStep && (
          <div className="space-y-4">
            <PropertiesSection title="Geral">
              <PropertyField label="Título da etapa">
                <Input
                  value={activeStep.title}
                  onChange={(e) =>
                    updateStep(activeStep.id, { title: e.target.value })
                  }
                  className="bg-background shadow-sm"
                />
              </PropertyField>
            </PropertiesSection>

            <PropertiesSection title="Header">
              {(
                [
                  ["showLogo", "Mostrar logo"],
                  ["showProgress", "Mostrar progresso"],
                  ["allowBack", "Permitir voltar"],
                ] as const
              ).map(([key, label]) => (
                <PropertyCheckbox
                  key={key}
                  label={label}
                  checked={activeStep.settings[key]}
                  onChange={(checked) =>
                    updateStep(activeStep.id, {
                      settings: {
                        ...activeStep.settings,
                        [key]: checked,
                      },
                    })
                  }
                />
              ))}
            </PropertiesSection>
          </div>
        )}

        {!selectedWidget && !activeStep && (
          <div className="rounded-xl border border-dashed border-border bg-background/80 px-4 py-8 text-center text-sm text-muted-foreground">
            Selecione uma etapa ou widget para editar as propriedades.
          </div>
        )}
      </div>
    </aside>
  );
}
