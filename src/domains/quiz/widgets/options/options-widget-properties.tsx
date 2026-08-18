"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PropertiesSection,
  PropertyCheckbox,
  PropertyColorSwatchReset,
  PropertyField,
  PropertySelect,
} from "@/domains/quiz/components/builder/property-panel-primitives";
import { WidgetGeneralProperties } from "@/domains/quiz/components/builder/widget-general-properties";
import { VariableKeyCombobox } from "@/domains/quiz/components/variables/variable-key-combobox";
import { useBuilderStore } from "@/domains/quiz/store/builder.store";
import {
  OPTIONS_MAX_COUNT,
  type OptionItem,
  type OptionsWidgetConfig,
} from "@/domains/quiz/types/builder.types";
import { generateId } from "@/domains/quiz/utils/generate-id";
import { collectFlowVariableTargetKeys } from "@/domains/quiz/utils/variable-registry.utils";
import { resolveOptionsColors } from "@/domains/quiz/utils/options-widget-styles.utils";
import { OptionImagePicker } from "@/domains/quiz/widgets/options/option-image-picker";
import { cn } from "@/lib/utils";

type OptionsWidgetPropertiesProps = {
  config: OptionsWidgetConfig;
  onChange: (config: OptionsWidgetConfig) => void;
  onFeedback?: (message: string) => void;
};

function SortableOptionRow({
  option,
  onUpdate,
  onRemove,
  canRemove,
}: {
  option: OptionItem;
  onUpdate: (patch: Partial<OptionItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "rounded-lg border border-border bg-background",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2 p-2">
        {expanded ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="flex size-8 shrink-0 items-center justify-center text-destructive disabled:opacity-40"
            aria-label="Remover opção"
          >
            <Trash2 className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            className="flex size-8 shrink-0 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Reordenar"
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <OptionImagePicker option={option} onChange={onUpdate} compact />

        {editingLabel ? (
          <Input
            value={option.label}
            autoFocus
            onChange={(e) => onUpdate({ label: e.target.value })}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
            className="h-8 flex-1 bg-background text-sm shadow-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingLabel(true)}
            className="min-w-0 flex-1 truncate text-left text-sm font-medium"
          >
            {option.label}
          </button>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Confirmar" : "Mais opções"}
        >
          {expanded ? (
            <Check className="size-4 text-primary" />
          ) : (
            <Pencil className="size-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          <PropertyCheckbox
            label="Validar Campos"
            checked={option.validateFields}
            onChange={(validateFields) => onUpdate({ validateFields })}
          />
        </div>
      )}
    </div>
  );
}

export function OptionsWidgetProperties({
  config,
  onChange,
  onFeedback,
}: OptionsWidgetPropertiesProps) {
  const design = useBuilderStore((s) => s.design);
  const flowLayout = useBuilderStore((s) => s.flowLayout);
  const ensureQuizVariable = useBuilderStore((s) => s.ensureQuizVariable);
  const resolvedColors = resolveOptionsColors(config, design);
  const [saveToVariable, setSaveToVariable] = useState(
    config.variableKey.length > 0,
  );

  useEffect(() => {
    setSaveToVariable(config.variableKey.length > 0);
  }, [config.variableKey]);

  const flowTargetKeys = collectFlowVariableTargetKeys(flowLayout);
  const hasFlowConflict =
    config.variableKey.length > 0 &&
    flowTargetKeys.includes(config.variableKey);

  function syncOptionsVariable(variableKey: string, multipleChoice: boolean) {
    if (!variableKey) return;
    ensureQuizVariable(
      variableKey,
      "Opções",
      multipleChoice ? "list" : "string",
    );
  }

  function handleVariableKeyChange(variableKey: string) {
    if (variableKey) {
      syncOptionsVariable(variableKey, config.multipleChoice);
    }
    onChange({ ...config, variableKey });
  }

  function handleMultipleChoiceChange(multipleChoice: boolean) {
    onChange({
      ...config,
      multipleChoice,
      autoAdvance: multipleChoice ? false : config.autoAdvance,
    });
    if (config.variableKey) {
      syncOptionsVariable(config.variableKey, multipleChoice);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function updateOption(id: string, patch: Partial<OptionItem>) {
    onChange({
      ...config,
      options: config.options.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = config.options.findIndex((o) => o.id === active.id);
    const newIndex = config.options.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onChange({
      ...config,
      options: arrayMove(config.options, oldIndex, newIndex),
    });
  }

  function addOption() {
    if (config.options.length >= OPTIONS_MAX_COUNT) return;

    const count = config.options.length + 1;
    const newOption: OptionItem = {
      id: generateId(),
      label: `Opção ${count}`,
      imageType: "emoji",
      emoji: "⭐",
      destinationStepId: null,
      validateFields: true,
    };
    onChange({ ...config, options: [...config.options, newOption] });
  }

  return (
    <div className="space-y-4">
      <PropertiesSection title="Layout">
        <PropertyField label="Layout">
          <PropertySelect
            value={config.layout}
            onChange={(layout) =>
              onChange({
                ...config,
                layout: layout as OptionsWidgetConfig["layout"],
              })
            }
          >
            <option value="list">Em lista</option>
            <option value="cols2">2 colunas</option>
            <option value="cols3">3 colunas</option>
            <option value="cols4">4 colunas</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Direção">
          <PropertySelect
            value={config.direction}
            onChange={(direction) =>
              onChange({
                ...config,
                direction: direction as OptionsWidgetConfig["direction"],
              })
            }
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Disposição">
          <PropertySelect
            value={config.disposition}
            onChange={(disposition) =>
              onChange({
                ...config,
                disposition: disposition as OptionsWidgetConfig["disposition"],
              })
            }
          >
            <option value="image_text">Imagem | Texto</option>
            <option value="text_image">Texto | Imagem</option>
            <option value="text_only">Só texto</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Opções">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.options.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {config.options.map((option) => (
                <SortableOptionRow
                  key={option.id}
                  option={option}
                  onUpdate={(patch) => updateOption(option.id, patch)}
                  onRemove={() =>
                    onChange({
                      ...config,
                      options: config.options.filter((o) => o.id !== option.id),
                    })
                  }
                  canRemove={config.options.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addOption}
          disabled={config.options.length >= OPTIONS_MAX_COUNT}
        >
          <Plus className="mr-2 size-4" />
          Adicionar Opção
          {config.options.length >= OPTIONS_MAX_COUNT && (
            <span className="ml-1 text-xs text-muted-foreground">
              (máx. {OPTIONS_MAX_COUNT})
            </span>
          )}
        </Button>
      </PropertiesSection>

      <PropertiesSection title="Variável">
        <PropertyCheckbox
          label="Salvar resultado em uma variável"
          checked={saveToVariable}
          onChange={(enabled) => {
            setSaveToVariable(enabled);
            if (!enabled) {
              onChange({ ...config, variableKey: "" });
            }
          }}
        />
        {saveToVariable && (
          <PropertyField label="Variável">
            <VariableKeyCombobox
              value={config.variableKey}
              labelHint="Opções"
              onChange={handleVariableKeyChange}
            />
          </PropertyField>
        )}
        <p className="text-xs text-muted-foreground">
          O valor gravado será o texto da opção selecionada
          {config.multipleChoice
            ? " em uma lista com todas as opções escolhidas"
            : ""}{" "}
          ao sair desta etapa.
        </p>
        {hasFlowConflict && (
          <p className="text-xs text-amber-600">
            A variável &quot;{config.variableKey}&quot; também é atualizada por
            nós Variável no fluxo. Deixe este campo vazio para usar apenas o
            fluxo como acumulador (ex.: soma).
          </p>
        )}
      </PropertiesSection>

      <PropertiesSection title="Validações">
        <div className="space-y-3">
          <div>
            <PropertyCheckbox
              label="Múltipla Escolha"
              checked={config.multipleChoice}
              onChange={handleMultipleChoiceChange}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              O usuário poderá selecionar múltiplas opções; o avanço deve ser
              feito por um componente Botão.
            </p>
          </div>

          <div>
            <PropertyCheckbox
              label="Obrigatório"
              checked={config.required}
              onChange={(required) => onChange({ ...config, required })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              O usuário é obrigado a selecionar alguma opção para avançar.
            </p>
          </div>

          <div>
            <PropertyCheckbox
              label="Auto-avançar"
              checked={config.autoAdvance}
              disabled={config.multipleChoice}
              onChange={(autoAdvance) => onChange({ ...config, autoAdvance })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {config.multipleChoice
                ? "Indisponível com múltipla escolha — use um componente Botão para avançar."
                : "O funil avança para a etapa definida na opção selecionada. Caso contrário, o usuário deve clicar em um Botão."}
            </p>
          </div>
        </div>
      </PropertiesSection>

      <PropertiesSection title="Estilização">
        <div className="grid grid-cols-3 gap-3">
          <PropertyField label="Bordas">
            <PropertySelect
              value={config.borderRadius}
              onChange={(borderRadius) =>
                onChange({
                  ...config,
                  borderRadius:
                    borderRadius as OptionsWidgetConfig["borderRadius"],
                })
              }
            >
              <option value="sm">Pequena</option>
              <option value="md">Média</option>
              <option value="lg">Grande</option>
              <option value="xl">Gigante</option>
            </PropertySelect>
          </PropertyField>

          <PropertyField label="Sombras">
            <PropertySelect
              value={config.shadow}
              onChange={(shadow) =>
                onChange({
                  ...config,
                  shadow: shadow as OptionsWidgetConfig["shadow"],
                })
              }
            >
              <option value="none">Nenhuma</option>
              <option value="sm">Pequena</option>
              <option value="md">Média</option>
              <option value="lg">Grande</option>
            </PropertySelect>
          </PropertyField>

          <PropertyField label="Espaçamento">
            <PropertySelect
              value={config.spacing}
              onChange={(spacing) =>
                onChange({
                  ...config,
                  spacing: spacing as OptionsWidgetConfig["spacing"],
                })
              }
            >
              <option value="sm">Pequeno</option>
              <option value="md">Normal</option>
              <option value="lg">Grande</option>
              <option value="xl">Gigante</option>
            </PropertySelect>
          </PropertyField>
        </div>

        <PropertyField label="Tamanho da imagem">
          <PropertySelect
            value={config.imageSize}
            onChange={(imageSize) =>
              onChange({
                ...config,
                imageSize: imageSize as OptionsWidgetConfig["imageSize"],
              })
            }
          >
            <option value="sm">Pequeno</option>
            <option value="md">Normal</option>
            <option value="lg">Grande</option>
            <option value="xl">Gigante</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Detalhe">
          <PropertySelect
            value={config.detail}
            onChange={(detail) =>
              onChange({
                ...config,
                detail: detail as OptionsWidgetConfig["detail"],
              })
            }
          >
            <option value="none">Nenhum</option>
            <option value="confirmation">Confirmação</option>
          </PropertySelect>
        </PropertyField>

        <PropertyField label="Estilo">
          <PropertySelect
            value={config.variant}
            onChange={(variant) =>
              onChange({
                ...config,
                variant: variant as OptionsWidgetConfig["variant"],
              })
            }
          >
            <option value="simple">Simples</option>
            <option value="outlined">Contornado</option>
          </PropertySelect>
        </PropertyField>
      </PropertiesSection>

      <PropertiesSection title="Personalização">
        <div className="grid grid-cols-3 gap-3">
          <PropertyColorSwatchReset
            label="Cor"
            value={resolvedColors.backgroundColor}
            onChange={(backgroundColor) =>
              onChange({ ...config, backgroundColor })
            }
            onReset={() => onChange({ ...config, backgroundColor: null })}
          />
          <PropertyColorSwatchReset
            label="Texto"
            value={resolvedColors.textColor}
            onChange={(textColor) => onChange({ ...config, textColor })}
            onReset={() => onChange({ ...config, textColor: null })}
          />
          <PropertyColorSwatchReset
            label="Borda"
            value={resolvedColors.borderColor}
            onChange={(borderColor) => onChange({ ...config, borderColor })}
            onReset={() => onChange({ ...config, borderColor: null })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <PropertyColorSwatchReset
            label="Sel. Cor"
            value={resolvedColors.selectedBackgroundColor}
            onChange={(selectedBackgroundColor) =>
              onChange({ ...config, selectedBackgroundColor })
            }
            onReset={() =>
              onChange({ ...config, selectedBackgroundColor: null })
            }
          />
          <PropertyColorSwatchReset
            label="Sel. Texto"
            value={resolvedColors.selectedTextColor}
            onChange={(selectedTextColor) =>
              onChange({ ...config, selectedTextColor })
            }
            onReset={() => onChange({ ...config, selectedTextColor: null })}
          />
          <PropertyColorSwatchReset
            label="Sel. Borda"
            value={resolvedColors.selectedBorderColor}
            onChange={(selectedBorderColor) =>
              onChange({ ...config, selectedBorderColor })
            }
            onReset={() => onChange({ ...config, selectedBorderColor: null })}
          />
        </div>
      </PropertiesSection>

      <WidgetGeneralProperties
        layout={config}
        onChange={(layout) => onChange({ ...config, ...layout })}
        onConfirmId={onFeedback}
      />
    </div>
  );
}
